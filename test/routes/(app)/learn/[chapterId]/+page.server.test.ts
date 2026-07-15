import { describe, it, expect } from "vitest";
import { load } from "../../../../../src/routes/(app)/learn/[chapterId]/+page.server";
import type { KvStore } from "$lib/server/kv";
import { progressKey } from "$lib/server/kv";
import { chapters } from "$lib/shared/content/index";
import type { ProgressRecord } from "$lib/shared/types";

const TEST_FINGERPRINT = "TESTFP";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY = "pk";
const CHAPTER_ONE_ID = "ch1";
const CHAPTER_TWO_ID = "ch2";
const UNKNOWN_CHAPTER_ID = "ch999";
const DASHBOARD_PATH = "/dashboard";
const STATUS_NOT_FOUND = 404;
const STATUS_COMPLETED = "completed";

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

async function captureHttpError(fn: () => unknown): Promise<number | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (typeof e === "object" && e !== null && "status" in e) {
      return (e as { status: number }).status;
    }
    return null;
  }
}

function buildProgressRecord(fingerprint: string, completedChallenges: string[]): ProgressRecord {
  return {
    fingerprint,
    completedChallenges,
    xp: 0,
    level: 1,
    achievements: [],
    lastActivityAt: "2024-01-01T00:00:00.000Z",
    streakDays: 0,
    completedLessons: []
  };
}

function getChapterOneLessonOneChallengeIds(): string[] {
  const chapter1 = chapters.find((c) => c.id === CHAPTER_ONE_ID)!;
  const lesson1 = chapter1.lessons[0]!;
  return lesson1.challenges.map((c) => c.id);
}

describe("load", () => {
  it("returns 404 for an unknown chapterId", async () => {
    const kv = createInMemoryKv();

    const status = await captureHttpError(() =>
      load({
        params: { chapterId: UNKNOWN_CHAPTER_ID },
        locals: makeLocals(),
        platform: makePlatform(kv)
      } as unknown as Parameters<typeof load>[0])
    );

    expect(status).toBe(STATUS_NOT_FOUND);
  });

  it("redirects to /dashboard when chapter is locked", async () => {
    const kv = createInMemoryKv();

    const location = await captureRedirect(() =>
      load({
        params: { chapterId: CHAPTER_TWO_ID },
        locals: makeLocals(),
        platform: makePlatform(kv)
      } as unknown as Parameters<typeof load>[0])
    );

    expect(location).toBe(DASHBOARD_PATH);
  });

  it("returns chapter and lessonSummaries for an unlocked chapter", async () => {
    const kv = createInMemoryKv();

    const result = await load({
      params: { chapterId: CHAPTER_ONE_ID },
      locals: makeLocals(),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({
      chapter: expect.objectContaining({ id: CHAPTER_ONE_ID }),
      lessonSummaries: expect.any(Array)
    });
  });

  it("marks completed lesson as completed", async () => {
    const completedIds = getChapterOneLessonOneChallengeIds();
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, completedIds))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      params: { chapterId: CHAPTER_ONE_ID },
      locals: makeLocals(),
      platform: makePlatform(kv)
    } as unknown as Parameters<typeof load>[0]);

    const firstLessonId = chapters.find((c) => c.id === CHAPTER_ONE_ID)!.lessons[0]!.id;
    expect(result).toMatchObject({
      lessonSummaries: expect.arrayContaining([
        expect.objectContaining({ id: firstLessonId, status: STATUS_COMPLETED })
      ])
    });
  });
});
