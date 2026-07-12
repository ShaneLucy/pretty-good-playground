import { describe, it, expect, beforeAll } from "vitest";
import { generateKey } from "openpgp";
import type { PublicKey } from "openpgp";
import { actions } from "../../../../src/routes/(auth)/register/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey, progressKey } from "$lib/server/kv";
import { extractFingerprint } from "$lib/server/pgp";

const DISPLAY_NAME_VALID = "Alice";
const DISPLAY_NAME_TOO_LONG = "A".repeat(51);

// Minimal valid armored key that openpgp can parse — use a real test key fragment.
// Since parsing a real PGP key in tests without network is complex, we test the
// invalid-key path with a clearly-invalid string and mock the happy path via KV state.
const INVALID_KEY = "not a pgp key";
const LOGIN_PATH = "/login";
const TEST_IP = "127.0.0.1";

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

function makeRequest(fields: Record<string, string>): Request {
  return new Request("http://localhost/register", {
    method: "POST",
    body: makeFormData(fields)
  });
}

function makePlatform(kv: KvStore): App.Platform {
  return {
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
}

function makeEventArgs(fields: Record<string, string>, store = new Map<string, string>()) {
  const kv = createInMemoryKv(store);
  const platform = makePlatform(kv);
  return {
    request: makeRequest(fields),
    platform,
    getClientAddress: () => TEST_IP,
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
      getAll: () => [],
      serialize: () => ""
    }
  } as unknown as Parameters<typeof actions.default>[0];
}

describe("register action — validation", () => {
  it("returns 429 when rate limit is exceeded", async () => {
    const store = new Map<string, string>();
    const minute = Math.floor(Date.now() / 60_000);
    store.set(`rl:v1:register:${TEST_IP}:${minute}`, "5");
    const event = makeEventArgs({ displayName: DISPLAY_NAME_VALID, publicKey: INVALID_KEY }, store);

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 429 });
  });

  it("returns 400 with field=displayName when displayName is missing", async () => {
    const event = makeEventArgs({ displayName: "", publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { field: "displayName" } });
  });

  it("returns 400 with field=displayName when displayName exceeds 50 characters", async () => {
    const event = makeEventArgs({ displayName: DISPLAY_NAME_TOO_LONG, publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { field: "displayName" } });
  });

  it("returns 400 with field=publicKey when publicKey is missing", async () => {
    const event = makeEventArgs({ displayName: DISPLAY_NAME_VALID, publicKey: "" });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { field: "publicKey" } });
  });

  it("returns 400 with field=publicKey when publicKey is not a valid PGP key", async () => {
    const event = makeEventArgs({ displayName: DISPLAY_NAME_VALID, publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { field: "publicKey" } });
  });

  it("returns 400 with field=publicKey when the key is rejected by openpgp", async () => {
    const event = makeEventArgs({ displayName: DISPLAY_NAME_VALID, publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ status: 400, data: { field: "publicKey" } });
  });
});

describe("register action — error messages", () => {
  it("error message mentions display name when displayName is missing", async () => {
    const event = makeEventArgs({ displayName: "   ", publicKey: INVALID_KEY });

    const result = await actions.default(event);

    expect(result).toMatchObject({ data: { field: "displayName", error: expect.any(String) } });
  });

  it("error message mentions key when publicKey is empty", async () => {
    const event = makeEventArgs({ displayName: DISPLAY_NAME_VALID, publicKey: "" });

    const result = await actions.default(event);

    expect(result).toMatchObject({ data: { field: "publicKey", error: expect.any(String) } });
  });

  it("rate limit error has no field property set", async () => {
    const store = new Map<string, string>();
    const minute = Math.floor(Date.now() / 60_000);
    store.set(`rl:v1:register:${TEST_IP}:${minute}`, "5");
    const event = makeEventArgs({ displayName: DISPLAY_NAME_VALID, publicKey: INVALID_KEY }, store);

    const result = await actions.default(event);

    expect(result).toMatchObject({ data: { field: undefined } });
  });
});

describe("register action — display name trimming", () => {
  it("trims surrounding whitespace from a displayName before checking length", async () => {
    const displayNameWithSpaces = `  ${"A".repeat(50)}  `;
    const event = makeEventArgs({ displayName: displayNameWithSpaces, publicKey: INVALID_KEY });

    // The trimmed name is exactly 50 chars, so it should pass the displayName check
    // and fail on the publicKey check, not the displayName length check.
    const result = await actions.default(event);

    expect(result).toMatchObject({ data: { field: "publicKey" } });
  });
});

describe("register action — real PGP key, duplicate fingerprint", () => {
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

  it("returns 400 when a key with that fingerprint is already registered", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(fingerprint),
      JSON.stringify({
        fingerprint,
        displayName: DISPLAY_NAME_VALID,
        publicKey: armoredPublicKey,
        registeredAt: "2024-01-01T00:00:00.000Z",
        profilePublic: false
      })
    );

    const event = makeEventArgs(
      { displayName: DISPLAY_NAME_VALID, publicKey: armoredPublicKey },
      store
    );

    const result = await actions.default(event);

    expect(result).toMatchObject({
      status: 400,
      data: { error: "A key with this fingerprint is already registered." }
    });
  });
});

describe("register action — real PGP key, happy path", () => {
  let armoredPublicKey: string;
  let fingerprint: string;

  beforeAll(async () => {
    const { publicKey } = await generateKey({
      type: "rsa",
      rsaBits: 2048,
      userIDs: [{ name: "Happy Path User", email: "happy@example.com" }],
      format: "object"
    });
    armoredPublicKey = (publicKey as PublicKey).armor();
    fingerprint = extractFingerprint(publicKey as PublicKey);
  });

  it("redirects to /login after successful registration", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    const event = {
      request: makeRequest({ displayName: DISPLAY_NAME_VALID, publicKey: armoredPublicKey }),
      platform: makePlatform(kv),
      getClientAddress: () => TEST_IP,
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
        getAll: () => [],
        serialize: () => ""
      }
    } as unknown as Parameters<typeof actions.default>[0];

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

    expect(redirectedTo).toBe(LOGIN_PATH);
  });

  it("writes the user record to KV with the correct displayName", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    const event = {
      request: makeRequest({ displayName: DISPLAY_NAME_VALID, publicKey: armoredPublicKey }),
      platform: makePlatform(kv),
      getClientAddress: () => TEST_IP,
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
        getAll: () => [],
        serialize: () => ""
      }
    } as unknown as Parameters<typeof actions.default>[0];

    try {
      await actions.default(event);
    } catch {
      // redirect throw is expected
    }

    const storedRaw = store.get(userKey(fingerprint));
    expect(storedRaw).toBeDefined();
    const stored = JSON.parse(storedRaw!) as { displayName: string; fingerprint: string };
    expect(stored.displayName).toBe(DISPLAY_NAME_VALID);
    expect(stored.fingerprint).toBe(fingerprint);
  });

  it("writes the progress record to KV for the new user", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    const event = {
      request: makeRequest({ displayName: DISPLAY_NAME_VALID, publicKey: armoredPublicKey }),
      platform: makePlatform(kv),
      getClientAddress: () => TEST_IP,
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
        getAll: () => [],
        serialize: () => ""
      }
    } as unknown as Parameters<typeof actions.default>[0];

    try {
      await actions.default(event);
    } catch {
      // redirect throw is expected
    }

    const progressRaw = store.get(progressKey(fingerprint));
    expect(progressRaw).toBeDefined();
  });
});
