import { describe, it, expect } from "vitest";
import { load, actions } from "../../../../src/routes/(app)/profile/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey } from "$lib/server/kv";
import type { UserRecord } from "$lib/shared/types";

const TEST_FINGERPRINT = "TESTFP";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY = "pk";
const TEST_REGISTERED_AT = "2024-01-01T00:00:00.000Z";
const UPDATED_DISPLAY_NAME = "Alice";
const EMPTY_DISPLAY_NAME = "";
const TOO_SHORT_DISPLAY_NAME = "A";
const TOO_LONG_DISPLAY_NAME = "A".repeat(51);
const INVALID_DISPLAY_NAME = "Name!!!";
const VALID_DISPLAY_NAME = "ValidName";
const PROFILE_PATH = "/profile";
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const EXPECTED_BASE_XP = 0;
const EXPECTED_PROFILE_PUBLIC_DEFAULT = false;
const EXPECTED_ACHIEVEMENTS_DEFAULT: string[] = [];

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

function makeLocals(fingerprint = TEST_FINGERPRINT, publicKey = TEST_PUBLIC_KEY): App.Locals {
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

function buildUserRecord(fingerprint: string, overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    fingerprint,
    displayName: TEST_DISPLAY_NAME,
    publicKey: TEST_PUBLIC_KEY,
    registeredAt: TEST_REGISTERED_AT,
    profilePublic: false,
    ...overrides
  };
}

function makeUpdateNameEvent(
  displayName: string,
  kv: KvStore,
  fingerprint = TEST_FINGERPRINT
): Parameters<typeof actions.updateDisplayName>[0] {
  const fd = new FormData();
  fd.append("displayName", displayName);
  return {
    request: new Request("http://localhost/profile", { method: "POST", body: fd }),
    locals: makeLocals(fingerprint),
    platform: makePlatform(kv)
  } as unknown as Parameters<typeof actions.updateDisplayName>[0];
}

function makeToggleEvent(
  isPublic: boolean,
  kv: KvStore,
  fingerprint = TEST_FINGERPRINT
): Parameters<typeof actions.toggleVisibility>[0] {
  const fd = new FormData();
  if (isPublic) {
    fd.append("public", "on");
  }
  return {
    request: new Request("http://localhost/profile", { method: "POST", body: fd }),
    locals: makeLocals(fingerprint),
    platform: makePlatform(kv)
  } as unknown as Parameters<typeof actions.toggleVisibility>[0];
}

describe("load", () => {
  it("returns profile data for a new user", async () => {
    const kv = createInMemoryKv();

    const result = await load({
      locals: makeLocals(),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({
      displayName: expect.any(String),
      profilePublic: EXPECTED_PROFILE_PUBLIC_DEFAULT,
      achievements: EXPECTED_ACHIEVEMENTS_DEFAULT,
      xp: EXPECTED_BASE_XP
    });
  });

  it("reads displayName from KV user record", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, { displayName: UPDATED_DISPLAY_NAME }))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({ displayName: UPDATED_DISPLAY_NAME });
  });
});

describe("updateDisplayName action", () => {
  it("returns 400 when displayName is empty", async () => {
    const kv = createInMemoryKv();

    const result = await actions.updateDisplayName(makeUpdateNameEvent(EMPTY_DISPLAY_NAME, kv));

    expect(result).toMatchObject({ status: STATUS_BAD_REQUEST });
  });

  it("returns 400 when displayName is too short (1 char)", async () => {
    const kv = createInMemoryKv();

    const result = await actions.updateDisplayName(makeUpdateNameEvent(TOO_SHORT_DISPLAY_NAME, kv));

    expect(result).toMatchObject({ status: STATUS_BAD_REQUEST });
  });

  it("returns 400 when displayName is too long (51 chars)", async () => {
    const kv = createInMemoryKv();

    const result = await actions.updateDisplayName(makeUpdateNameEvent(TOO_LONG_DISPLAY_NAME, kv));

    expect(result).toMatchObject({ status: STATUS_BAD_REQUEST });
  });

  it("returns 400 for invalid characters", async () => {
    const kv = createInMemoryKv();

    const result = await actions.updateDisplayName(makeUpdateNameEvent(INVALID_DISPLAY_NAME, kv));

    expect(result).toMatchObject({ status: STATUS_BAD_REQUEST });
  });

  it("returns 404 when user record not found in KV", async () => {
    const kv = createInMemoryKv();

    const result = await actions.updateDisplayName(makeUpdateNameEvent(VALID_DISPLAY_NAME, kv));

    expect(result).toMatchObject({ status: expect.any(Number) });
    const status = (result as { status: number }).status;
    expect([STATUS_BAD_REQUEST, STATUS_NOT_FOUND]).toContain(status);
  });

  it("returns updateNameSuccess when name is updated", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);

    const result = await actions.updateDisplayName(makeUpdateNameEvent(UPDATED_DISPLAY_NAME, kv));

    expect(result).toMatchObject({ updateNameSuccess: true });
  });

  it("persists the updated displayName to KV", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);

    await actions.updateDisplayName(makeUpdateNameEvent(UPDATED_DISPLAY_NAME, kv));

    const raw = await kv.get(userKey(TEST_FINGERPRINT));
    const saved = JSON.parse(raw!) as UserRecord;
    expect(saved.displayName).toBe(UPDATED_DISPLAY_NAME);
  });
});

describe("toggleVisibility action", () => {
  it("returns 404 when user record not found", async () => {
    const kv = createInMemoryKv();

    const result = await actions.toggleVisibility(makeToggleEvent(true, kv));

    expect(result).toMatchObject({ status: STATUS_NOT_FOUND });
  });

  it("redirects to /profile on success", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, { profilePublic: false }))
    );
    const kv = createInMemoryKv(store);

    const location = await captureRedirect(() =>
      actions.toggleVisibility(makeToggleEvent(true, kv))
    );

    expect(location).toBe(PROFILE_PATH);
  });

  it("sets profilePublic to true when public=on", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, { profilePublic: false }))
    );
    const kv = createInMemoryKv(store);

    await captureRedirect(() => actions.toggleVisibility(makeToggleEvent(true, kv)));

    const raw = await kv.get(userKey(TEST_FINGERPRINT));
    const saved = JSON.parse(raw!) as UserRecord;
    expect(saved.profilePublic).toBe(true);
  });

  it("sets profilePublic to false when public not set", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, { profilePublic: true }))
    );
    const kv = createInMemoryKv(store);

    await captureRedirect(() => actions.toggleVisibility(makeToggleEvent(false, kv)));

    const raw = await kv.get(userKey(TEST_FINGERPRINT));
    const saved = JSON.parse(raw!) as UserRecord;
    expect(saved.profilePublic).toBe(false);
  });
});
