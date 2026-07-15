import { describe, it, expect } from "vitest";
import { load, actions } from "../../../../src/routes/(app)/keys/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey, progressKey } from "$lib/server/kv";
import type { UserRecord } from "$lib/shared/types";

const TEST_FINGERPRINT = "TESTFP";
const TEST_DISPLAY_NAME = "Test User";
const TEST_REGISTERED_AT = "2024-01-01T00:00:00.000Z";
const ARMORED_PK_FROM_KV = "ARMORED_PK";
const LOCAL_PK = "LOCAL_PK";
const DEREGISTER_CONFIRMATION = "DEREGISTER";
const WRONG_CONFIRMATION = "WRONG";
const HOME_PATH = "/";
const STATUS_BAD_REQUEST = 400;

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

function makePlatform(mainKv: KvStore): App.Platform {
  return {
    env: {
      MAIN_KV: mainKv as unknown as App.Platform["env"]["MAIN_KV"],
      EPHEMERAL_KV: {} as App.Platform["env"]["EPHEMERAL_KV"],
      JWT_SECRET: "test-secret",
      CHALLENGE_PRIVATE_KEY: "",
      CHALLENGE_KEY_PASSPHRASE: ""
    },
    ctx: {} as App.Platform["ctx"],
    context: {} as App.Platform["context"],
    caches: {} as App.Platform["caches"]
  };
}

function makeLocals(fingerprint = TEST_FINGERPRINT, publicKey = "pk"): App.Locals {
  return {
    user: {
      fingerprint,
      displayName: TEST_DISPLAY_NAME,
      publicKey
    },
    flash: null
  };
}

async function captureRedirect(fn: () => unknown): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (typeof e === "object" && e !== null && "location" in e) {
      return (e as { location: string }).location;
    }
    return null;
  }
}

function buildUserRecord(fingerprint: string, publicKey: string): UserRecord {
  return {
    fingerprint,
    displayName: TEST_DISPLAY_NAME,
    publicKey,
    registeredAt: TEST_REGISTERED_AT,
    profilePublic: false
  };
}

function makeDeregisterEvent(
  confirmation: string,
  mainKv: KvStore,
  fingerprint = TEST_FINGERPRINT
): Parameters<typeof actions.deregister>[0] {
  const fd = new FormData();
  fd.append("confirmation", confirmation);
  return {
    request: new Request("http://localhost/keys", { method: "POST", body: fd }),
    platform: makePlatform(mainKv),
    locals: makeLocals(fingerprint),
    cookies: { delete: () => {} }
  } as unknown as Parameters<typeof actions.deregister>[0];
}

describe("load", () => {
  it("returns armoredPublicKey and fingerprint", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, ARMORED_PK_FROM_KV))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(TEST_FINGERPRINT),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({
      armoredPublicKey: ARMORED_PK_FROM_KV,
      fingerprint: TEST_FINGERPRINT
    });
  });

  it("falls back to locals.user.publicKey when no KV record", async () => {
    const kv = createInMemoryKv();
    const locals = makeLocals(TEST_FINGERPRINT, LOCAL_PK);

    const result = await load({
      locals,
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({ armoredPublicKey: LOCAL_PK });
  });
});

describe("deregister action", () => {
  it("returns 400 when confirmation text is wrong", async () => {
    const kv = createInMemoryKv();
    const event = makeDeregisterEvent(WRONG_CONFIRMATION, kv);

    const result = await actions.deregister(event);

    expect(result).toMatchObject({ status: STATUS_BAD_REQUEST });
  });

  it("deletes user and progress records from KV on success", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT, "pk")));
    store.set(progressKey(TEST_FINGERPRINT), JSON.stringify({ fingerprint: TEST_FINGERPRINT }));
    const kv = createInMemoryKv(store);

    await captureRedirect(() =>
      actions.deregister(makeDeregisterEvent(DEREGISTER_CONFIRMATION, kv))
    );

    expect(await kv.get(userKey(TEST_FINGERPRINT))).toBeNull();
    expect(await kv.get(progressKey(TEST_FINGERPRINT))).toBeNull();
  });

  it("redirects to / on success", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT, "pk")));
    const kv = createInMemoryKv(store);

    const location = await captureRedirect(() =>
      actions.deregister(makeDeregisterEvent(DEREGISTER_CONFIRMATION, kv))
    );

    expect(location).toBe(HOME_PATH);
  });
});
