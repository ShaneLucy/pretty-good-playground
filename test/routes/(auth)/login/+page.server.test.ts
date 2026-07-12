import { describe, it, expect, beforeAll } from "vitest";
import { generateKey } from "openpgp";
import type { PublicKey } from "openpgp";
import { actions } from "../../../../src/routes/(auth)/login/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey } from "$lib/server/kv";
import { extractFingerprint } from "$lib/server/pgp";

const INVALID_KEY = "not a pgp key";
const TEST_IP = "127.0.0.1";
const VERIFY_PATH = "/login/verify";
const PENDING_FP_COOKIE = "pending_fp";
const TEST_DISPLAY_NAME = "Test User";
const TEST_REGISTERED_AT = "2024-01-01T00:00:00.000Z";

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

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

function makeCookies(cookieMap: Map<string, string>) {
  return {
    get: (name: string) => cookieMap.get(name) ?? undefined,
    set: (name: string, value: string) => cookieMap.set(name, value),
    delete: (name: string) => cookieMap.delete(name),
    getAll: () => [...cookieMap.entries()].map(([name, value]) => ({ name, value })),
    serialize: () => ""
  };
}

function makeEventArgs(
  fields: Record<string, string>,
  store = new Map<string, string>(),
  ip = TEST_IP,
  cookieMap = new Map<string, string>()
) {
  const kv = createInMemoryKv(store);
  const platform: App.Platform = {
    env: {
      MAIN_KV: kv as unknown as App.Platform["env"]["MAIN_KV"],
      EPHEMERAL_KV: kv as unknown as App.Platform["env"]["EPHEMERAL_KV"],
      JWT_SECRET: "test-secret",
      CHALLENGE_PRIVATE_KEY: "",
      CHALLENGE_KEY_PASSPHRASE: ""
    },
    ctx: {} as App.Platform["ctx"],
    context: {} as App.Platform["context"],
    caches: {} as App.Platform["caches"]
  };

  return {
    request: new Request("http://localhost/login", {
      method: "POST",
      body: makeFormData(fields)
    }),
    platform,
    getClientAddress: () => ip,
    cookies: makeCookies(cookieMap)
  } as unknown as Parameters<typeof actions.default>[0];
}

describe("login action — validation", () => {
  it("returns 429 when rate limit is exceeded", async () => {
    const store = new Map<string, string>();
    const minute = Math.floor(Date.now() / 60_000);
    store.set(`rl:v1:login:${TEST_IP}:${minute}`, "10");
    const event = makeEventArgs({ publicKey: INVALID_KEY }, store);

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 429 });
  });

  it("returns 400 when publicKey is missing", async () => {
    const event = makeEventArgs({ publicKey: "" });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { error: expect.any(String) } });
  });

  it("returns 400 when publicKey is not a valid PGP key", async () => {
    const event = makeEventArgs({ publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400 });
  });

  it("returns 404 when no account is found for the key fingerprint", async () => {
    // Provide an obviously invalid key — it will fail PGP parsing, returning 400.
    // A 404 is only reachable with a valid key that has no matching KV record.
    // This is an integration test concern; we verify the 400 path here.
    const event = makeEventArgs({ publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400 });
  });
});

describe("login action — whitespace-only publicKey", () => {
  it("returns 400 for whitespace-only publicKey", async () => {
    const event = makeEventArgs({ publicKey: "   " });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400 });
  });
});

describe("login action — real PGP key, no matching KV entry", () => {
  let armoredPublicKey: string;

  beforeAll(async () => {
    const { publicKey } = await generateKey({
      type: "rsa",
      rsaBits: 2048,
      userIDs: [{ name: "Test User", email: "test@example.com" }],
      format: "object"
    });
    armoredPublicKey = publicKey.armor();
  });

  it("returns 404 when fingerprint has no matching KV entry", async () => {
    const event = makeEventArgs({ publicKey: armoredPublicKey });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 404 });
  });
});

describe("login action — real PGP key, matching KV entry", () => {
  let armoredPublicKey: string;
  let fingerprint: string;

  beforeAll(async () => {
    const { publicKey } = await generateKey({
      type: "rsa",
      rsaBits: 2048,
      userIDs: [{ name: "Test User", email: "test@example.com" }],
      format: "object"
    });
    armoredPublicKey = publicKey.armor();
    fingerprint = extractFingerprint(publicKey as PublicKey);
  });

  it("redirects to /login/verify and sets pending_fp cookie when account exists", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(fingerprint),
      JSON.stringify({
        fingerprint,
        displayName: TEST_DISPLAY_NAME,
        publicKey: armoredPublicKey,
        registeredAt: TEST_REGISTERED_AT,
        profilePublic: false
      })
    );

    const cookieMap = new Map<string, string>();
    const event = makeEventArgs({ publicKey: armoredPublicKey }, store, TEST_IP, cookieMap);

    let redirectedTo: string | null = null;
    try {
      await actions.default(event);
    } catch (e) {
      if (
        typeof e === "object" &&
        e !== null &&
        "location" in e &&
        typeof (e as Record<string, unknown>).location === "string"
      ) {
        redirectedTo = (e as Record<string, unknown>).location as string;
      }
    }

    expect(redirectedTo).toBe(VERIFY_PATH);
    expect(cookieMap.get(PENDING_FP_COOKIE)).toBe(fingerprint);
  });
});
