import { describe, it, expect, beforeEach } from "vitest";
import { handle } from "../src/hooks.server";
import type { KvStore } from "$lib/server/kv";
import { signJwt } from "$lib/server/auth";
import type { UserRecord } from "$lib/shared/types";

const TEST_SECRET = "test-jwt-secret";
const TEST_FINGERPRINT = "AABBCCDD11223344";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY =
  "-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----";

const SECURITY_HEADER_FRAME = "X-Frame-Options";
const SECURITY_HEADER_CONTENT_TYPE = "X-Content-Type-Options";
const SECURITY_HEADER_REFERRER = "Referrer-Policy";
const SECURITY_HEADER_PERMISSIONS = "Permissions-Policy";

function createInMemoryKv(store = new Map<string, string>()): KvStore {
  return {
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, value);
    },
    delete: async (key) => {
      store.delete(key);
    }
  };
}

function makeUserRecord(fingerprint: string): UserRecord {
  return {
    fingerprint,
    displayName: TEST_DISPLAY_NAME,
    publicKey: TEST_PUBLIC_KEY,
    registeredAt: new Date().toISOString(),
    profilePublic: false
  };
}

function makeEvent(overrides: {
  sessionCookie?: string;
  platform?: App.Platform | null;
}): Parameters<typeof handle>[0]["event"] {
  const { sessionCookie, platform } = overrides;

  const cookies = new Map<string, string>();
  if (sessionCookie) {
    cookies.set("session", sessionCookie);
  }

  const locals: App.Locals = { user: null, flash: null };

  return {
    locals,
    platform: platform === undefined ? null : platform,
    cookies: {
      get: (name: string) => cookies.get(name) ?? undefined,
      set: (name: string, value: string) => cookies.set(name, value),
      delete: (name: string) => cookies.delete(name),
      getAll: () => [...cookies.entries()].map(([name, value]) => ({ name, value })),
      serialize: () => ""
    },
    setHeaders: () => {},
    request: new Request("http://localhost/"),
    url: new URL("http://localhost/"),
    params: {},
    route: { id: "/" },
    isDataRequest: false,
    isSubRequest: false,
    fetch: fetch,
    getClientAddress: () => "127.0.0.1"
  } as unknown as Parameters<typeof handle>[0]["event"];
}

function makeResolve() {
  return async (): Promise<Response> => new Response("ok", { status: 200 });
}

describe("handle — security headers", () => {
  it("sets X-Frame-Options: DENY", async () => {
    const event = makeEvent({ platform: null });

    const response = await handle({ event, resolve: makeResolve() });

    expect(response.headers.get(SECURITY_HEADER_FRAME)).toBe("DENY");
  });

  it("sets X-Content-Type-Options: nosniff", async () => {
    const event = makeEvent({ platform: null });

    const response = await handle({ event, resolve: makeResolve() });

    expect(response.headers.get(SECURITY_HEADER_CONTENT_TYPE)).toBe("nosniff");
  });

  it("sets Referrer-Policy: strict-origin-when-cross-origin", async () => {
    const event = makeEvent({ platform: null });

    const response = await handle({ event, resolve: makeResolve() });

    expect(response.headers.get(SECURITY_HEADER_REFERRER)).toBe("strict-origin-when-cross-origin");
  });

  it("sets Permissions-Policy restricting camera and microphone", async () => {
    const event = makeEvent({ platform: null });

    const response = await handle({ event, resolve: makeResolve() });

    expect(response.headers.get(SECURITY_HEADER_PERMISSIONS)).toContain("camera=()");
    expect(response.headers.get(SECURITY_HEADER_PERMISSIONS)).toContain("microphone=()");
  });
});

describe("handle — platform is null (dev mode)", () => {
  it("sets locals.user to null", async () => {
    const event = makeEvent({ platform: null });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.user).toBeNull();
  });

  it("sets locals.flash to null", async () => {
    const event = makeEvent({ platform: null });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.flash).toBeNull();
  });
});

describe("handle — no session cookie", () => {
  let store: Map<string, string>;
  let platform: App.Platform;

  beforeEach(() => {
    store = new Map();
    const kv = createInMemoryKv(store);
    platform = {
      env: {
        MAIN_KV: kv as unknown as App.Platform["env"]["MAIN_KV"],
        EPHEMERAL_KV: kv as unknown as App.Platform["env"]["EPHEMERAL_KV"],
        JWT_SECRET: TEST_SECRET,
        CHALLENGE_PRIVATE_KEY: "",
        CHALLENGE_KEY_PASSPHRASE: ""
      },
      ctx: {} as App.Platform["ctx"],
      context: {} as App.Platform["context"],
      caches: {} as App.Platform["caches"]
    };
  });

  it("sets locals.user to null when there is no session cookie", async () => {
    const event = makeEvent({ platform });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.user).toBeNull();
  });

  it("sets locals.flash to null when there is no session cookie", async () => {
    const event = makeEvent({ platform });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.flash).toBeNull();
  });
});

describe("handle — valid session cookie with existing user", () => {
  let store: Map<string, string>;
  let platform: App.Platform;

  beforeEach(() => {
    store = new Map();
    store.set(`user:v1:${TEST_FINGERPRINT}`, JSON.stringify(makeUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);
    platform = {
      env: {
        MAIN_KV: kv as unknown as App.Platform["env"]["MAIN_KV"],
        EPHEMERAL_KV: kv as unknown as App.Platform["env"]["EPHEMERAL_KV"],
        JWT_SECRET: TEST_SECRET,
        CHALLENGE_PRIVATE_KEY: "",
        CHALLENGE_KEY_PASSPHRASE: ""
      },
      ctx: {} as App.Platform["ctx"],
      context: {} as App.Platform["context"],
      caches: {} as App.Platform["caches"]
    };
  });

  it("populates locals.user with fingerprint and displayName from KV", async () => {
    const jwt = await signJwt({ sub: TEST_FINGERPRINT }, TEST_SECRET, "1h");
    const event = makeEvent({ sessionCookie: jwt, platform });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.user).toMatchObject({
      fingerprint: TEST_FINGERPRINT,
      displayName: TEST_DISPLAY_NAME
    });
  });
});

describe("handle — invalid session cookie", () => {
  let store: Map<string, string>;
  let platform: App.Platform;

  beforeEach(() => {
    store = new Map();
    store.set(`user:v1:${TEST_FINGERPRINT}`, JSON.stringify(makeUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);
    platform = {
      env: {
        MAIN_KV: kv as unknown as App.Platform["env"]["MAIN_KV"],
        EPHEMERAL_KV: kv as unknown as App.Platform["env"]["EPHEMERAL_KV"],
        JWT_SECRET: TEST_SECRET,
        CHALLENGE_PRIVATE_KEY: "",
        CHALLENGE_KEY_PASSPHRASE: ""
      },
      ctx: {} as App.Platform["ctx"],
      context: {} as App.Platform["context"],
      caches: {} as App.Platform["caches"]
    };
  });

  it("sets locals.user to null for a token signed with a different secret", async () => {
    const jwt = await signJwt({ sub: TEST_FINGERPRINT }, "wrong-secret", "1h");
    const event = makeEvent({ sessionCookie: jwt, platform });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.user).toBeNull();
  });

  it("sets locals.user to null for a completely invalid token string", async () => {
    const event = makeEvent({ sessionCookie: "not.a.valid.jwt", platform });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.user).toBeNull();
  });

  it("sets locals.user to null when user record is not found in KV", async () => {
    store.clear();
    const jwt = await signJwt({ sub: TEST_FINGERPRINT }, TEST_SECRET, "1h");
    const event = makeEvent({ sessionCookie: jwt, platform });

    await handle({ event, resolve: makeResolve() });

    expect(event.locals.user).toBeNull();
  });
});
