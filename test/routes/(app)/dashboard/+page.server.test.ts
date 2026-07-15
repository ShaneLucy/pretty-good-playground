import { describe, it, expect } from "vitest";
import { load } from "../../../../src/routes/(app)/dashboard/+page.server";
import type { KvStore } from "$lib/server/kv";
import { userKey, progressKey } from "$lib/server/kv";
import { chapters } from "$lib/shared/content/index";
import type { ProgressRecord, UserRecord } from "$lib/shared/types";

const TEST_FINGERPRINT = "TESTFP";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY = "pk";
const TEST_REGISTERED_AT = "2024-01-01T00:00:00.000Z";
const EXPECTED_BASE_LEVEL = 1;
const EXPECTED_BASE_XP = 0;
const EXPECTED_MIN_XP_TO_NEXT = 0;
const CHAPTER_ONE_ID = "ch1";
const STATUS_IN_PROGRESS = "in-progress";
const LEVEL_EXTRA_XP_THRESHOLD = 16001;
const EXPECTED_EXTRA_LEVEL = 11;
const EXPECTED_EXTRA_LEVEL_XP_BAND = 4000;

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

function buildUserRecord(fingerprint = TEST_FINGERPRINT): UserRecord {
  return {
    fingerprint,
    displayName: TEST_DISPLAY_NAME,
    publicKey: TEST_PUBLIC_KEY,
    registeredAt: TEST_REGISTERED_AT,
    profilePublic: false
  };
}

function buildProgressRecord(
  fingerprint: string,
  completedChallenges: string[],
  overrides: Partial<ProgressRecord> = {}
): ProgressRecord {
  return {
    fingerprint,
    completedChallenges,
    xp: 0,
    level: 1,
    achievements: [],
    lastActivityAt: "2024-01-01T00:00:00.000Z",
    streakDays: 0,
    completedLessons: [],
    ...overrides
  };
}

function getAllChallengeIds(): string[] {
  return chapters.flatMap((ch) => ch.lessons.flatMap((l) => l.challenges.map((c) => c.id)));
}

describe("load", () => {
  it("returns chapterSummaries, continueLesson, and stats for a new user", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord()));
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(TEST_FINGERPRINT),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({
      chapterSummaries: expect.any(Array),
      continueLesson: expect.objectContaining({ chapterId: CHAPTER_ONE_ID }),
      stats: { xp: EXPECTED_BASE_XP, level: EXPECTED_BASE_LEVEL }
    });
  });

  it("marks chapter 1 as in-progress when at least one challenge is completed", async () => {
    const chapter1 = chapters.find((c) => c.id === CHAPTER_ONE_ID);
    const firstChallengeId = chapter1!.lessons[0]!.challenges[0]!.id;

    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord()));
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, [firstChallengeId]))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(TEST_FINGERPRINT),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({
      chapterSummaries: expect.arrayContaining([
        expect.objectContaining({ id: CHAPTER_ONE_ID, status: STATUS_IN_PROGRESS })
      ])
    });
  });

  it("returns null continueLesson when all chapters are complete", async () => {
    const allIds = getAllChallengeIds();

    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord()));
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, allIds))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(TEST_FINGERPRINT),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({ continueLesson: null });
  });

  it("stats.xpToNextLevel is greater than 0", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord()));
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(TEST_FINGERPRINT),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    const data = result as { stats: { xpToNextLevel: number } };
    expect(data.stats.xpToNextLevel).toBeGreaterThan(EXPECTED_MIN_XP_TO_NEXT);
  });

  it("calculates XP band correctly for levels above the threshold table (level 11+)", async () => {
    const store = new Map<string, string>();
    store.set(userKey(TEST_FINGERPRINT), JSON.stringify(buildUserRecord()));
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(
        buildProgressRecord(TEST_FINGERPRINT, [], {
          xp: LEVEL_EXTRA_XP_THRESHOLD,
          level: EXPECTED_EXTRA_LEVEL
        })
      )
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      locals: makeLocals(TEST_FINGERPRINT),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    const data = result as { stats: { level: number; xpToNextLevel: number } };
    expect(data.stats.level).toBe(EXPECTED_EXTRA_LEVEL);
    expect(data.stats.xpToNextLevel).toBe(EXPECTED_EXTRA_LEVEL_XP_BAND);
  });
});
