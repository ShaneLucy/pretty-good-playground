import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { generateKey } from "openpgp";
import type { PublicKey } from "openpgp";
import { load, actions } from "../../../../../src/routes/(auth)/login/verify/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey, pendingAuthKey } from "$lib/server/kv";
import { extractFingerprint } from "$lib/server/pgp";

const TEST_FINGERPRINT = "AABBCCDD11223344AABBCCDD11223344AABBCCDD";
const TEST_NONCE = "550e8400-e29b-41d4-a716-446655440000";
const TEST_IP = "127.0.0.1";
const PENDING_FP_COOKIE = "pending_fp";
const LOGIN_PATH = "/login";
const INVALID_JSON = "{ this is not valid json !!!";
const GARBAGE_SIGNATURE = "not a pgp signed message";
const TEST_DISPLAY_NAME = "Test User";
const TEST_REGISTERED_AT = "2024-01-01T00:00:00.000Z";

interface PendingAuthRecord {
  nonce: string;
  createdAt: number;
  rememberDevice: boolean;
}

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

function makePlatform(mainKv: KvStore, ephemeralKv: KvStore): App.Platform {
  return {
    env: {
      MAIN_KV: mainKv as unknown as App.Platform["env"]["MAIN_KV"],
      EPHEMERAL_KV: ephemeralKv as unknown as App.Platform["env"]["EPHEMERAL_KV"],
      JWT_SECRET: "test-secret",
      CHALLENGE_PRIVATE_KEY: "",
      CHALLENGE_KEY_PASSPHRASE: ""
    },
    ctx: {} as App.Platform["ctx"],
    context: {} as App.Platform["context"],
    caches: {} as App.Platform["caches"]
  };
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

async function captureRedirectFromLoad(
  cookieMap: Map<string, string>,
  mainKv: KvStore,
  ephemeralKv: KvStore
): Promise<string | null> {
  try {
    await load({
      cookies: makeCookies(cookieMap) as unknown as Parameters<typeof load>[0]["cookies"],
      platform: makePlatform(mainKv, ephemeralKv)
    } as unknown as Parameters<typeof load>[0]);
    return null;
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "location" in e &&
      typeof (e as Record<string, unknown>).location === "string"
    ) {
      return (e as Record<string, unknown>).location as string;
    }
    return null;
  }
}

describe("load — no pending_fp cookie", () => {
  it("redirects to /login when pending_fp cookie is absent", async () => {
    const cookieMap = new Map<string, string>();
    const kv = createInMemoryKv();

    const redirectedTo = await captureRedirectFromLoad(cookieMap, kv, kv);

    expect(redirectedTo).toBe(LOGIN_PATH);
  });
});

describe("load — no challenge in KV", () => {
  it("redirects to /login when challenge is not found", async () => {
    const cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);
    const ephemeralKv = createInMemoryKv(new Map<string, string>());
    const mainKv = createInMemoryKv();

    const redirectedTo = await captureRedirectFromLoad(cookieMap, mainKv, ephemeralKv);

    expect(redirectedTo).toBe(LOGIN_PATH);
  });
});

describe("load — invalid JSON in KV", () => {
  it("redirects to /login when KV value is invalid JSON", async () => {
    const cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);
    const ephemeralStore = new Map([[pendingAuthKey(TEST_FINGERPRINT), INVALID_JSON]]);
    const ephemeralKv = createInMemoryKv(ephemeralStore);
    const mainKv = createInMemoryKv();

    const redirectedTo = await captureRedirectFromLoad(cookieMap, mainKv, ephemeralKv);

    expect(redirectedTo).toBe(LOGIN_PATH);
  });
});

describe("load — JSON that does not match PendingAuthRecord shape", () => {
  it("redirects to /login when JSON is valid but missing required fields", async () => {
    const cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);
    const malformed = JSON.stringify({ someOtherField: "unexpected" });
    const ephemeralStore = new Map([[pendingAuthKey(TEST_FINGERPRINT), malformed]]);
    const ephemeralKv = createInMemoryKv(ephemeralStore);
    const mainKv = createInMemoryKv();

    const redirectedTo = await captureRedirectFromLoad(cookieMap, mainKv, ephemeralKv);

    expect(redirectedTo).toBe(LOGIN_PATH);
  });
});

describe("load — valid pending auth", () => {
  it("returns the nonce from the pending auth record", async () => {
    const pendingAuth: PendingAuthRecord = {
      nonce: TEST_NONCE,
      createdAt: Date.now(),
      rememberDevice: false
    };

    const cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);
    const ephemeralStore = new Map([
      [pendingAuthKey(TEST_FINGERPRINT), JSON.stringify(pendingAuth)]
    ]);
    const ephemeralKv = createInMemoryKv(ephemeralStore);
    const mainKv = createInMemoryKv();

    const result = await load({
      cookies: makeCookies(cookieMap) as unknown as Parameters<typeof load>[0]["cookies"],
      platform: makePlatform(mainKv, ephemeralKv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toEqual({ nonce: TEST_NONCE });
  });
});

describe("verify action — validation", () => {
  let ephemeralStore: Map<string, string>;
  let mainStore: Map<string, string>;
  let cookieMap: Map<string, string>;

  beforeEach(() => {
    ephemeralStore = new Map();
    mainStore = new Map();
    cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);

    const pendingAuth: PendingAuthRecord = {
      nonce: TEST_NONCE,
      createdAt: Date.now(),
      rememberDevice: false
    };
    ephemeralStore.set(pendingAuthKey(TEST_FINGERPRINT), JSON.stringify(pendingAuth));
  });

  function makeActionEvent(signature: string) {
    const mainKv = createInMemoryKv(mainStore);
    const ephemeralKv = createInMemoryKv(ephemeralStore);

    const fd = new FormData();
    fd.append("signature", signature);

    return {
      request: new Request("http://localhost/login/verify", {
        method: "POST",
        body: fd
      }),
      platform: makePlatform(mainKv, ephemeralKv),
      getClientAddress: () => TEST_IP,
      cookies: makeCookies(cookieMap)
    } as unknown as Parameters<typeof actions.default>[0];
  }

  it("returns 429 when rate limit is exceeded", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    mainStore.set(`rl:v1:login-verify:${TEST_IP}:${minute}`, "5");
    const event = makeActionEvent("some-signature");

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 429 });
  });

  it("returns 400 when no pending_fp cookie is present", async () => {
    cookieMap.delete(PENDING_FP_COOKIE);
    const event = makeActionEvent("some-signature");

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400 });
  });

  it("returns 400 when signature is empty", async () => {
    const event = makeActionEvent("");

    const result = await actions.default(event);

    // Challenge gets consumed then signature validation fails
    expect(result).toMatchObject({ status: 400 });
  });

  it("deletes the challenge from KV to prevent replay after action starts", async () => {
    const mainKv = createInMemoryKv(mainStore);
    const ephemeralKv = createInMemoryKv(ephemeralStore);

    const fd = new FormData();
    fd.append("signature", "some-signature");

    const event = {
      request: new Request("http://localhost/login/verify", { method: "POST", body: fd }),
      platform: makePlatform(mainKv, ephemeralKv),
      getClientAddress: () => TEST_IP,
      cookies: makeCookies(cookieMap)
    } as unknown as Parameters<typeof actions.default>[0];

    await actions.default(event);

    const remaining = await ephemeralKv.get(pendingAuthKey(TEST_FINGERPRINT));
    expect(remaining).toBeNull();
  });
});

describe("verify action — platform undefined", () => {
  it("returns 503 when platform is undefined", async () => {
    const fd = new FormData();
    fd.append("signature", GARBAGE_SIGNATURE);

    const event = {
      request: new Request("http://localhost/login/verify", { method: "POST", body: fd }),
      platform: undefined,
      getClientAddress: () => TEST_IP,
      cookies: makeCookies(new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]))
    } as unknown as Parameters<typeof actions.default>[0];

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 503 });
  });
});

describe("verify action — real PGP key", () => {
  let armoredPublicKey: string;
  let fingerprint: string;

  beforeAll(async () => {
    const { publicKey } = await generateKey({
      type: "rsa",
      rsaBits: 2048,
      userIDs: [{ name: "Test User", email: "test@example.com" }],
      format: "object"
    });
    armoredPublicKey = (publicKey as PublicKey).armor();
    fingerprint = extractFingerprint(publicKey as PublicKey);
  });

  function makePendingEphemeralStore(): Map<string, string> {
    const store = new Map<string, string>();
    const pendingAuth: PendingAuthRecord = {
      nonce: TEST_NONCE,
      createdAt: Date.now(),
      rememberDevice: false
    };
    store.set(pendingAuthKey(fingerprint), JSON.stringify(pendingAuth));
    return store;
  }

  function makeUserMainStore(): Map<string, string> {
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
    return store;
  }

  it("returns 400 when user record is not in mainKv but pending auth exists", async () => {
    const ephemeralStore = makePendingEphemeralStore();
    const mainStore = new Map<string, string>();
    const cookieMap = new Map([[PENDING_FP_COOKIE, fingerprint]]);

    const fd = new FormData();
    fd.append("signature", GARBAGE_SIGNATURE);

    const event = {
      request: new Request("http://localhost/login/verify", { method: "POST", body: fd }),
      platform: makePlatform(createInMemoryKv(mainStore), createInMemoryKv(ephemeralStore)),
      getClientAddress: () => TEST_IP,
      cookies: makeCookies(cookieMap)
    } as unknown as Parameters<typeof actions.default>[0];

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { error: expect.any(String) } });
  });

  it("returns 400 when signature is invalid (non-PGP text) with a valid user record", async () => {
    const ephemeralStore = makePendingEphemeralStore();
    const mainStore = makeUserMainStore();
    const cookieMap = new Map([[PENDING_FP_COOKIE, fingerprint]]);

    const fd = new FormData();
    fd.append("signature", GARBAGE_SIGNATURE);

    const event = {
      request: new Request("http://localhost/login/verify", { method: "POST", body: fd }),
      platform: makePlatform(createInMemoryKv(mainStore), createInMemoryKv(ephemeralStore)),
      getClientAddress: () => TEST_IP,
      cookies: makeCookies(cookieMap)
    } as unknown as Parameters<typeof actions.default>[0];

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400 });
  });
});
