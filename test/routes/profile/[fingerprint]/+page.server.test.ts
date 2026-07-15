import { describe, it, expect } from "vitest";
import { load } from "../../../../src/routes/profile/[fingerprint]/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey } from "$lib/server/kv";
import type { UserRecord } from "$lib/shared/types";

const TEST_FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const TEST_DISPLAY_NAME = "Alice";
const TEST_PUBLIC_KEY = "pk";
const TEST_REGISTERED_AT = "2024-01-01T00:00:00.000Z";
const UNKNOWN_FINGERPRINT = "UNKNOWN";
const STATUS_NOT_FOUND = 404;
const EXPECTED_BASE_XP = 0;
const EXPECTED_BASE_LEVEL = 1;

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

function buildUserRecord(fingerprint: string, overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    fingerprint,
    displayName: TEST_DISPLAY_NAME,
    publicKey: TEST_PUBLIC_KEY,
    registeredAt: TEST_REGISTERED_AT,
    profilePublic: true,
    ...overrides
  };
}

function makeLoadEvent(fingerprint: string, kv: KvStore): Parameters<typeof load>[0] {
  return {
    params: { fingerprint },
    platform: makePlatform(kv)
  } as unknown as Parameters<typeof load>[0];
}

async function captureError(fn: () => unknown): Promise<{ status: number } | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (typeof e === "object" && e !== null && "status" in e) {
      return e as { status: number };
    }
    return null;
  }
}

describe("load — 404 cases", () => {
  it("throws 404 when the user record does not exist", async () => {
    const kv = createInMemoryKv();

    const err = await captureError(() => load(makeLoadEvent(UNKNOWN_FINGERPRINT, kv)));

    expect(err?.status).toBe(STATUS_NOT_FOUND);
  });

  it("throws 404 when the user record exists but profilePublic is false", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, { profilePublic: false }))
    );
    const kv = createInMemoryKv(store);

    const err = await captureError(() => load(makeLoadEvent(TEST_FINGERPRINT, kv)));

    expect(err?.status).toBe(STATUS_NOT_FOUND);
  });
});

interface LoadResult {
  displayName: string;
  fingerprint: string;
  achievements: readonly string[];
  chapterProgresses: { id: string; title: string; percentComplete: number }[];
  xp: number;
  level: number;
  streakDays: number;
}

async function loadOrThrow(event: Parameters<typeof load>[0]): Promise<LoadResult> {
  const result = await load(event);
  return result as LoadResult;
}

describe("load — success case", () => {
  it("returns profile data for a public user with no prior progress", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);

    const result = await loadOrThrow(makeLoadEvent(TEST_FINGERPRINT, kv));

    expect(result).toMatchObject({
      displayName: TEST_DISPLAY_NAME,
      fingerprint: TEST_FINGERPRINT,
      xp: EXPECTED_BASE_XP,
      level: EXPECTED_BASE_LEVEL,
      achievements: []
    });
  });

  it("returns the display name from the KV user record", async () => {
    const store = new Map<string, string>();
    store.set(
      userKey(TEST_FINGERPRINT),
      JSON.stringify(buildUserRecord(TEST_FINGERPRINT, { displayName: "Bob" }))
    );
    const kv = createInMemoryKv(store);

    const result = await loadOrThrow(makeLoadEvent(TEST_FINGERPRINT, kv));

    expect(result.displayName).toBe("Bob");
  });

  it("returns chapterProgresses for all chapters", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);

    const result = await loadOrThrow(makeLoadEvent(TEST_FINGERPRINT, kv));

    expect(result.chapterProgresses.length).toBeGreaterThan(0);
    expect(result.chapterProgresses[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      percentComplete: expect.any(Number)
    });
  });

  it("returns streakDays for the user", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord(TEST_FINGERPRINT)));
    const kv = createInMemoryKv(store);

    const result = await loadOrThrow(makeLoadEvent(TEST_FINGERPRINT, kv));

    expect(typeof result.streakDays).toBe("number");
  });
});
