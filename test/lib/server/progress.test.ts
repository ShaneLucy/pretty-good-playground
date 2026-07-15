import { describe, it, expect } from "vitest";
import type { KvStore } from "$lib/server/kv";
import { progressKey } from "$lib/server/kv";
import type { Chapter } from "$lib/shared/types";
import {
  completeChallenge,
  createEmptyProgress,
  getProgress,
  saveProgress
} from "$lib/server/progress";

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

describe("getProgress — corrupt JSON", () => {
  const CORRUPT_FINGERPRINT = "FP_CORRUPT";
  const CORRUPT_JSON = "{ bad json";

  it("returns empty progress when JSON in KV is corrupt", async () => {
    const store = new Map([[progressKey(CORRUPT_FINGERPRINT), CORRUPT_JSON]]);
    const kv = createInMemoryKv(store);

    const result = await getProgress(kv, CORRUPT_FINGERPRINT);

    expect(result.fingerprint).toBe(CORRUPT_FINGERPRINT);
    expect(result.xp).toBe(0);
    expect(result.level).toBe(1);
    expect(result.completedChallenges).toHaveLength(0);
  });
});

describe("completeChallenge — attempt XP tiers", () => {
  const SECOND_ATTEMPT_XP = 35;
  const DEFAULT_ATTEMPT_XP = 20;
  // Pre-seed progress with lastActivityAt matching BASE_PARAMS.nowIso so the
  // daily-return bonus does not apply and base XP is isolated.
  const SAME_DAY_ACTIVITY = BASE_PARAMS.nowIso;

  it("awards second-attempt XP for attemptNumber 2", async () => {
    const kv = createInMemoryKv();
    await saveProgress(kv, {
      ...createEmptyProgress("FP_ATT2"),
      lastActivityAt: SAME_DAY_ACTIVITY
    });

    const { xpAwarded } = await completeChallenge({
      kv,
      fingerprint: "FP_ATT2",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      attemptNumber: 2
    });

    expect(xpAwarded).toBe(SECOND_ATTEMPT_XP);
  });

  it("awards default XP for attemptNumber 3 or more", async () => {
    const kv = createInMemoryKv();
    await saveProgress(kv, {
      ...createEmptyProgress("FP_ATT3"),
      lastActivityAt: SAME_DAY_ACTIVITY
    });

    const { xpAwarded } = await completeChallenge({
      kv,
      fingerprint: "FP_ATT3",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      attemptNumber: 3
    });

    expect(xpAwarded).toBe(DEFAULT_ATTEMPT_XP);
  });
});

describe("completeChallenge — streak reset", () => {
  const OLD_ACTIVITY_DATE = "2025-01-01T00:00:00.000Z";
  const OLD_STREAK_DATE = "2025-01-01";
  const STALE_STREAK_DAYS = 5;
  const CHALLENGE_DATE_AFTER_GAP = "2025-01-10T00:00:00.000Z";
  const RESET_STREAK_DAYS = 1;

  it("resets streakDays to 1 when gap is 2+ days", async () => {
    const kv = createInMemoryKv();

    await saveProgress(kv, {
      ...createEmptyProgress("FP_STREAK"),
      lastActivityAt: OLD_ACTIVITY_DATE,
      streakLastDate: OLD_STREAK_DATE,
      streakDays: STALE_STREAK_DAYS
    });

    const { progress } = await completeChallenge({
      kv,
      fingerprint: "FP_STREAK",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      nowIso: CHALLENGE_DATE_AFTER_GAP
    });

    expect(progress.streakDays).toBe(RESET_STREAK_DAYS);
  });

  it("awards daily return bonus when activity date has changed", async () => {
    const DAILY_RETURN_BONUS_XP = 25;
    const DEFAULT_ATTEMPT_XP = 20;
    const kv = createInMemoryKv();

    await saveProgress(kv, {
      ...createEmptyProgress("FP_STREAK_BONUS"),
      lastActivityAt: OLD_ACTIVITY_DATE,
      streakLastDate: OLD_STREAK_DATE,
      streakDays: STALE_STREAK_DAYS
    });

    const { xpAwarded } = await completeChallenge({
      kv,
      fingerprint: "FP_STREAK_BONUS",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      attemptNumber: 3,
      nowIso: CHALLENGE_DATE_AFTER_GAP
    });

    expect(xpAwarded).toBeGreaterThanOrEqual(DEFAULT_ATTEMPT_XP + DAILY_RETURN_BONUS_XP);
  });
});

describe("completeChallenge — graduate achievement", () => {
  const ch5Only: readonly Chapter[] = [
    {
      id: "ch5",
      title: "Chapter 5",
      description: "",
      lessons: [
        {
          id: "ch5-l1",
          title: "L1",
          description: "",
          xpReward: 10,
          challenges: [{ id: "ch5-l1-c1", setup: { type: "sign", plaintext: "sign" } }]
        }
      ]
    }
  ];

  it("earns the graduate achievement when completing chapter ch5", async () => {
    const kv = createInMemoryKv();

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_GRAD",
      challengeId: "ch5-l1-c1",
      lessonId: "ch5-l1",
      chapterId: "ch5",
      challengeType: "sign",
      hintsUsed: 0,
      attemptNumber: 1,
      chapters: ch5Only,
      nowIso: BASE_PARAMS.nowIso
    });

    expect(newAchievements).toContain("graduate");
  });
});

describe("completeChallenge — persistence achievement", () => {
  const PERSISTENCE_THRESHOLD_ATTEMPT = 5;

  it("earns the persistence achievement when attemptNumber is 5 or more", async () => {
    const kv = createInMemoryKv();

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_PERSIST",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      attemptNumber: PERSISTENCE_THRESHOLD_ATTEMPT
    });

    expect(newAchievements).toContain("persistence");
  });
});

describe("completeChallenge — all_chapters_complete achievement", () => {
  const twoChapterMock: readonly Chapter[] = [
    {
      id: "ch1",
      title: "C1",
      description: "",
      lessons: [
        {
          id: "ch1-l1",
          title: "",
          description: "",
          xpReward: 10,
          challenges: [{ id: "ch1-l1-c1", setup: { type: "explainer", content: "x" } }]
        }
      ]
    },
    {
      id: "ch2",
      title: "C2",
      description: "",
      lessons: [
        {
          id: "ch2-l1",
          title: "",
          description: "",
          xpReward: 10,
          challenges: [{ id: "ch2-l1-c1", setup: { type: "explainer", content: "x" } }]
        }
      ]
    }
  ];

  it("earns all_chapters_complete when the last challenge of the last chapter is done", async () => {
    const kv = createInMemoryKv();

    await saveProgress(kv, {
      ...createEmptyProgress("FP_ALL"),
      completedChallenges: ["ch1-l1-c1"]
    });

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_ALL",
      challengeId: "ch2-l1-c1",
      lessonId: "ch2-l1",
      chapterId: "ch2",
      challengeType: "explainer",
      hintsUsed: 0,
      attemptNumber: 1,
      chapters: twoChapterMock,
      nowIso: BASE_PARAMS.nowIso
    });

    expect(newAchievements).toContain("all_chapters_complete");
  });
});

describe("completeChallenge — night_owl achievement", () => {
  const NIGHT_OWL_HOUR_ISO = "2025-06-15T01:30:00.000Z";
  const DAYTIME_HOUR_ISO = "2025-06-15T12:00:00.000Z";

  it("awards night_owl when submission UTC hour is 0–3", async () => {
    const kv = createInMemoryKv();

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_NIGHT1",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      nowIso: NIGHT_OWL_HOUR_ISO
    });

    expect(newAchievements).toContain("night_owl");
  });

  it("does not award night_owl when UTC hour is 12", async () => {
    const kv = createInMemoryKv();

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_NIGHT2",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      nowIso: DAYTIME_HOUR_ISO
    });

    expect(newAchievements).not.toContain("night_owl");
  });

  it("does not award night_owl a second time if already earned", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    await saveProgress(kv, {
      ...createEmptyProgress("FP_NIGHT3"),
      achievements: ["night_owl"],
      lastActivityAt: NIGHT_OWL_HOUR_ISO
    });

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_NIGHT3",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      nowIso: NIGHT_OWL_HOUR_ISO
    });

    expect(newAchievements).not.toContain("night_owl");
  });
});

describe("completeChallenge — paranoid_compliment achievement", () => {
  const singleChapterMock: readonly Chapter[] = [
    {
      id: "ch1",
      title: "C1",
      description: "",
      lessons: [
        {
          id: "ch1-l1",
          title: "",
          description: "",
          xpReward: 10,
          challenges: [
            { id: "ch1-l1-c1", setup: { type: "explainer", content: "x" } },
            { id: "ch1-l1-c2", setup: { type: "explainer", content: "y" } }
          ]
        }
      ]
    }
  ];

  it("awards paranoid_compliment when all chapters complete with zero total hints", async () => {
    const kv = createInMemoryKv();

    await saveProgress(kv, {
      ...createEmptyProgress("FP_PARANOID1"),
      completedChallenges: ["ch1-l1-c1"],
      totalHintsUsed: 0
    });

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_PARANOID1",
      challengeId: "ch1-l1-c2",
      lessonId: "ch1-l1",
      chapterId: "ch1",
      challengeType: "explainer",
      hintsUsed: 0,
      attemptNumber: 1,
      chapters: singleChapterMock,
      nowIso: BASE_PARAMS.nowIso
    });

    expect(newAchievements).toContain("paranoid_compliment");
  });

  it("does not award paranoid_compliment when all chapters complete but hints were used", async () => {
    const kv = createInMemoryKv();

    await saveProgress(kv, {
      ...createEmptyProgress("FP_PARANOID2"),
      completedChallenges: ["ch1-l1-c1"],
      totalHintsUsed: 1
    });

    const { newAchievements } = await completeChallenge({
      kv,
      fingerprint: "FP_PARANOID2",
      challengeId: "ch1-l1-c2",
      lessonId: "ch1-l1",
      chapterId: "ch1",
      challengeType: "explainer",
      hintsUsed: 0,
      attemptNumber: 1,
      chapters: singleChapterMock,
      nowIso: BASE_PARAMS.nowIso
    });

    expect(newAchievements).not.toContain("paranoid_compliment");
  });
});

describe("completeChallenge — totalHintsUsed accumulation", () => {
  it("accumulates totalHintsUsed correctly across multiple calls", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    await saveProgress(kv, {
      ...createEmptyProgress("FP_HINTS"),
      totalHintsUsed: 2,
      lastActivityAt: BASE_PARAMS.nowIso
    });

    const { progress } = await completeChallenge({
      kv,
      fingerprint: "FP_HINTS",
      challengeId: "ch1-l1-c1",
      ...BASE_PARAMS,
      hintsUsed: 3
    });

    expect(progress.totalHintsUsed).toBe(5);
  });
});
