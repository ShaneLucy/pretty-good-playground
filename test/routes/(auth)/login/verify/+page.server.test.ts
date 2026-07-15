import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { generateKey, createCleartextMessage, sign } from "openpgp";
import type { PublicKey, PrivateKey } from "openpgp";
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

describe("verify action — consumed / missing pending auth in KV (line 106)", () => {
  it("returns 400 when cookie is present but ephemeral KV has no pending auth record", async () => {
    const ephemeralStore = new Map<string, string>();
    const mainStore = new Map<string, string>();
    const cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);

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
});

describe("verify action — unparseable stored public key (line 127)", () => {
  it("returns 400 when the stored public key in KV cannot be parsed by openpgp", async () => {
    const MALFORMED_PUBLIC_KEY = "NOT_A_REAL_PGP_KEY";
    const pendingAuth: PendingAuthRecord = {
      nonce: TEST_NONCE,
      createdAt: Date.now(),
      rememberDevice: false
    };
    const ephemeralStore = new Map([
      [pendingAuthKey(TEST_FINGERPRINT), JSON.stringify(pendingAuth)]
    ]);
    const mainStore = new Map([
      [
        userKey(TEST_FINGERPRINT),
        JSON.stringify({
          fingerprint: TEST_FINGERPRINT,
          displayName: TEST_DISPLAY_NAME,
          publicKey: MALFORMED_PUBLIC_KEY,
          registeredAt: TEST_REGISTERED_AT,
          profilePublic: false
        })
      ]
    ]);
    const cookieMap = new Map([[PENDING_FP_COOKIE, TEST_FINGERPRINT]]);

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
});

describe("verify action — success path (lines 144-149)", () => {
  let armoredPublicKey: string;
  let privateKeyObj: PrivateKey;
  let fingerprint: string;

  beforeAll(async () => {
    const generated = await generateKey({
      type: "rsa",
      rsaBits: 2048,
      userIDs: [{ name: TEST_DISPLAY_NAME, email: "test@example.com" }],
      format: "object"
    });
    armoredPublicKey = (generated.publicKey as PublicKey).armor();
    privateKeyObj = generated.privateKey as PrivateKey;
    fingerprint = extractFingerprint(generated.publicKey as PublicKey);
  });

  async function makeValidSignature(text: string): Promise<string> {
    const message = await createCleartextMessage({ text });
    return sign({ message, signingKeys: privateKeyObj });
  }

  it("redirects to /dashboard after a valid signature (lines 144-149)", async () => {
    const armoredSignedMessage = await makeValidSignature(TEST_NONCE);

    const pendingAuth: PendingAuthRecord = {
      nonce: TEST_NONCE,
      createdAt: Date.now(),
      rememberDevice: false
    };
    const ephemeralStore = new Map([[pendingAuthKey(fingerprint), JSON.stringify(pendingAuth)]]);
    const mainStore = new Map([
      [
        userKey(fingerprint),
        JSON.stringify({
          fingerprint,
          displayName: TEST_DISPLAY_NAME,
          publicKey: armoredPublicKey,
          registeredAt: TEST_REGISTERED_AT,
          profilePublic: false
        })
      ]
    ]);
    const cookieMap = new Map([[PENDING_FP_COOKIE, fingerprint]]);
    const setCookieCalls: Array<{ name: string; value: string }> = [];
    const deletedCookies: string[] = [];

    const fd = new FormData();
    fd.append("signature", armoredSignedMessage);

    const event = {
      request: new Request("http://localhost/login/verify", { method: "POST", body: fd }),
      platform: makePlatform(createInMemoryKv(mainStore), createInMemoryKv(ephemeralStore)),
      getClientAddress: () => TEST_IP,
      cookies: {
        get: (name: string) => cookieMap.get(name) ?? undefined,
        set: (name: string, value: string) => {
          cookieMap.set(name, value);
          setCookieCalls.push({ name, value });
        },
        delete: (name: string) => deletedCookies.push(name),
        getAll: () => [...cookieMap.entries()].map(([name, value]) => ({ name, value })),
        serialize: () => ""
      }
    } as unknown as Parameters<typeof actions.default>[0];

    let redirectLocation: string | null = null;
    try {
      await actions.default(event);
    } catch (e) {
      if (typeof e === "object" && e !== null && "location" in e) {
        redirectLocation = (e as { location: string }).location;
      }
    }

    expect(redirectLocation).toBe("/dashboard");
    expect(setCookieCalls.some((c) => c.name === "session")).toBe(true);
    expect(deletedCookies).toContain("pending_fp");
  });

  it("sets maxAge on the session cookie when rememberDevice is true (line 43)", async () => {
    const armoredSignedMessage = await makeValidSignature(TEST_NONCE);

    const pendingAuth: PendingAuthRecord = {
      nonce: TEST_NONCE,
      createdAt: Date.now(),
      rememberDevice: true
    };
    const ephemeralStore = new Map([[pendingAuthKey(fingerprint), JSON.stringify(pendingAuth)]]);
    const mainStore = new Map([
      [
        userKey(fingerprint),
        JSON.stringify({
          fingerprint,
          displayName: TEST_DISPLAY_NAME,
          publicKey: armoredPublicKey,
          registeredAt: TEST_REGISTERED_AT,
          profilePublic: false
        })
      ]
    ]);
    const cookieMap = new Map([[PENDING_FP_COOKIE, fingerprint]]);
    const cookieSetOptions: Array<Record<string, unknown>> = [];

    const fd = new FormData();
    fd.append("signature", armoredSignedMessage);

    const event = {
      request: new Request("http://localhost/login/verify", { method: "POST", body: fd }),
      platform: makePlatform(createInMemoryKv(mainStore), createInMemoryKv(ephemeralStore)),
      getClientAddress: () => TEST_IP,
      cookies: {
        get: (name: string) => cookieMap.get(name) ?? undefined,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          cookieMap.set(name, value);
          cookieSetOptions.push({ name, ...options });
        },
        delete: (name: string) => cookieMap.delete(name),
        getAll: () => [...cookieMap.entries()].map(([name, value]) => ({ name, value })),
        serialize: () => ""
      }
    } as unknown as Parameters<typeof actions.default>[0];

    try {
      await actions.default(event);
    } catch {
      // redirect throws — expected
    }

    const sessionCookieOptions = cookieSetOptions.find((o) => o.name === "session");
    expect(sessionCookieOptions).toBeDefined();
    expect(typeof sessionCookieOptions?.maxAge).toBe("number");
    expect((sessionCookieOptions?.maxAge as number) > 0).toBe(true);
  });
});
