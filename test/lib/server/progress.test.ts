import { describe, it, expect } from "vitest";
import type { KvStore } from "$lib/server/kv";
import type { Chapter } from "$lib/shared/types";
import { completeChallenge, createEmptyProgress } from "$lib/server/progress";

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

const mockChapters: readonly Chapter[] = [
  {
    id: "ch1",
    title: "Chapter 1",
    description: "",
    lessons: [
      {
        id: "ch1-l1",
        title: "Lesson 1",
        description: "",
        xpReward: 10,
        challenges: [
          { id: "ch1-l1-c1", setup: { type: "sign", plaintext: "sign me" } },
          { id: "ch1-l1-c2", setup: { type: "explainer", content: "read this" } }
        ]
      }
    ]
  }
];

const BASE_PARAMS = {
  lessonId: "ch1-l1",
  chapterId: "ch1",
  challengeType: "sign",
  hintsUsed: 0,
  attemptNumber: 1,
  chapters: mockChapters,
  nowIso: "2025-06-15T10:00:00.000Z"
};

describe("completeChallenge", () => {
  it("awards XP on first completion", async () => {
    const kv = createInMemoryKv();
    const { xpAwarded } = await completeChallenge({
      kv,
      fingerprint: "FP1",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS
    });
    expect(xpAwarded).toBeGreaterThan(0);
  });

  it("is idempotent — second completion awards 0 XP", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);
    await completeChallenge({ kv, fingerprint: "FP2", challengeId: "ch1-l1-c1", ...BASE_PARAMS });
    const second = await completeChallenge({
      kv,
      fingerprint: "FP2",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS
    });
    expect(second.xpAwarded).toBe(0);
    expect(second.newAchievements).toHaveLength(0);
  });

  it("earns first_signature achievement on first sign challenge", async () => {
    const kv = createInMemoryKv();
    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP3",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      challengeType: "sign"
    });
    expect(newAchievements).toContain("first_signature");
  });

  it("does not re-earn first_signature if already achieved", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);
    // First completion earns first_signature
    await completeChallenge({
      kv,
      fingerprint: "FP4",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      challengeType: "sign"
    });
    // Second different challenge of same type — first_signature should not be earned again
    const second = await completeChallenge({
      kv,
      fingerprint: "FP4",
      challengeId: "ch1-l1-c2",
      ...BASE_PARAMS,
      challengeType: "sign"
    });
    expect(second.newAchievements).not.toContain("first_signature");
  });

  it("awards chapter completion bonus when final challenge in chapter is done", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);
    // Complete first challenge
    await completeChallenge({
      kv,
      fingerprint: "FP5",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS
    });
    // Complete the final challenge — should trigger chapter bonus
    const final = await completeChallenge({
      kv,
      fingerprint: "FP5",
      challengeId: "ch1-l1-c2",
      ...BASE_PARAMS,
      challengeType: "explainer"
    });
    expect(final.newAchievements).toContain("ch1_complete");
    // Chapter bonus XP is 200, plus base 50 + no daily return bonus (same day)
    expect(final.xpAwarded).toBeGreaterThanOrEqual(200);
  });

  it("earns first_lesson on the very first challenge completed", async () => {
    const kv = createInMemoryKv();
    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP6",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS
    });
    expect(newAchievements).toContain("first_lesson");
  });

  it("creates correct empty progress", () => {
    const p = createEmptyProgress("TESTFP");
    expect(p.fingerprint).toBe("TESTFP");
    expect(p.xp).toBe(0);
    expect(p.level).toBe(1);
    expect(p.completedChallenges).toHaveLength(0);
  });
});
