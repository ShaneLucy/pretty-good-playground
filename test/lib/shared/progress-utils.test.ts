import { describe, it, expect } from "vitest";
import type { ProgressRecord, Chapter } from "$lib/shared/types";
import { CHALLENGE_TYPES } from "$lib/shared/types";
import { chapters } from "$lib/shared/content/index";
import {
  levelFromXp,
  levelTitle,
  chapterPercent,
  deriveUnlockedChapters,
  currentLesson,
  streakStatus
} from "$lib/shared/progress-utils";

function makeProgress(overrides: Partial<ProgressRecord> = {}): ProgressRecord {
  return {
    fingerprint: "TEST",
    completedChallenges: [],
    xp: 0,
    level: 1,
    achievements: [],
    lastActivityAt: "2025-01-01T00:00:00.000Z",
    streakDays: 0,
    ...overrides
  };
}

describe("levelFromXp", () => {
  it.each([
    [0, 1],
    [199, 1],
    [200, 2],
    [499, 2],
    [500, 3],
    [999, 3],
    [1000, 4],
    [11999, 9],
    [12000, 10],
    [16000, 11],
    [20001, 12]
  ])("xp=%i → level %i", (xp, expected) => {
    expect(levelFromXp(xp)).toBe(expected);
  });

  it("returns level 1 for negative XP", () => {
    expect(levelFromXp(-1)).toBe(1);
  });
});

describe("levelTitle", () => {
  const CURIOUS_BEGINNER = "Curious Beginner";

  it('returns "Curious Beginner" for level 1', () => {
    expect(levelTitle(1)).toBe(CURIOUS_BEGINNER);
  });
  it('returns "Cryptographer" for level 10', () => {
    expect(levelTitle(10)).toBe("Cryptographer");
  });
  it('returns "Distinguished Cryptographer" for level 11+', () => {
    expect(levelTitle(11)).toBe("Distinguished Cryptographer");
    expect(levelTitle(99)).toBe("Distinguished Cryptographer");
  });
  it('returns "Curious Beginner" for level 0', () => {
    expect(levelTitle(0)).toBe(CURIOUS_BEGINNER);
  });
  it('returns "Curious Beginner" for negative level', () => {
    expect(levelTitle(-1)).toBe(CURIOUS_BEGINNER);
  });
});

describe("chapterPercent", () => {
  const ch1 = chapters[0];
  const EMPTY_CHAPTER: Chapter = { id: "ch0", title: "", description: "", lessons: [] };

  it("returns 0 with no completions", () => {
    expect(chapterPercent(makeProgress(), ch1)).toBe(0);
  });

  it("returns 100 when all chapter 1 challenges are complete", () => {
    const allIds = ch1.lessons.flatMap((l) => l.challenges.map((c) => c.id));
    const p = makeProgress({ completedChallenges: allIds });
    expect(chapterPercent(p, ch1)).toBe(100);
  });

  it("returns a value between 0 and 100 for partial completion", () => {
    const firstId = ch1.lessons[0].challenges[0].id;
    const p = makeProgress({ completedChallenges: [firstId] });
    const pct = chapterPercent(p, ch1);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it("returns 0 when chapter has no lessons", () => {
    expect(chapterPercent(makeProgress(), EMPTY_CHAPTER)).toBe(0);
  });
});

describe("deriveUnlockedChapters", () => {
  it("always unlocks chapter 1", () => {
    const result = deriveUnlockedChapters(makeProgress(), chapters);
    expect(result).toContain("ch1");
  });

  it("does not unlock chapter 2 when chapter 1 is incomplete", () => {
    const result = deriveUnlockedChapters(makeProgress(), chapters);
    expect(result).not.toContain("ch2");
  });

  it("unlocks chapter 2 when all chapter 1 challenges are complete", () => {
    const allCh1Ids = chapters[0].lessons.flatMap((l) => l.challenges.map((c) => c.id));
    const p = makeProgress({ completedChallenges: allCh1Ids });
    const result = deriveUnlockedChapters(p, chapters);
    expect(result).toContain("ch2");
  });
});

describe("currentLesson", () => {
  const ch1 = chapters[0];

  it("returns first lesson when none are complete", () => {
    const lesson = currentLesson(makeProgress(), ch1);
    expect(lesson?.id).toBe(ch1.lessons[0].id);
  });

  it("returns next lesson after completing the first", () => {
    const firstLessonChallenges = ch1.lessons[0].challenges.map((c) => c.id);
    const p = makeProgress({ completedChallenges: firstLessonChallenges });
    const lesson = currentLesson(p, ch1);
    expect(lesson?.id).toBe(ch1.lessons[1]?.id ?? null);
  });

  it("returns null when all lessons are complete", () => {
    const allIds = ch1.lessons.flatMap((l) => l.challenges.map((c) => c.id));
    const p = makeProgress({ completedChallenges: allIds });
    expect(currentLesson(p, ch1)).toBeNull();
  });
});

describe("streakStatus", () => {
  it("is active when last date is today", () => {
    const p = makeProgress({ streakLastDate: "2025-06-15" });
    expect(streakStatus(p, "2025-06-15")).toEqual({ active: true, shouldReset: false });
  });

  it("is active when last date was yesterday", () => {
    const p = makeProgress({ streakLastDate: "2025-06-14" });
    expect(streakStatus(p, "2025-06-15")).toEqual({ active: true, shouldReset: false });
  });

  it("should reset when gap is 2+ days", () => {
    const p = makeProgress({ streakLastDate: "2025-06-12" });
    expect(streakStatus(p, "2025-06-15")).toEqual({ active: false, shouldReset: true });
  });

  it("returns inactive with no streakLastDate", () => {
    const p = makeProgress({ streakLastDate: undefined });
    expect(streakStatus(p, "2025-06-15")).toEqual({ active: false, shouldReset: false });
  });
});

describe("CHALLENGE_TYPES", () => {
  const EXPECTED_CHALLENGE_TYPE_COUNT = 6;

  it("contains the six expected types", () => {
    expect(CHALLENGE_TYPES).toContain("sign");
    expect(CHALLENGE_TYPES).toHaveLength(EXPECTED_CHALLENGE_TYPE_COUNT);
  });
});
