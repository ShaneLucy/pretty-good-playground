import type { Chapter, ProgressRecord } from "$lib/shared/types";
import type { KvStore } from "./kv";
import { progressKey } from "./kv";
import { levelFromXp, streakStatus } from "$lib/shared/progress-utils";

export function createEmptyProgress(fingerprint: string): ProgressRecord {
  return {
    fingerprint,
    completedChallenges: [],
    completedLessons: [],
    xp: 0,
    level: 1,
    achievements: [],
    lastActivityAt: new Date().toISOString(),
    streakDays: 0,
    streakLastDate: undefined
  };
}

export async function getProgress(kv: KvStore, fingerprint: string): Promise<ProgressRecord> {
  const raw = await kv.get(progressKey(fingerprint));
  if (!raw) return createEmptyProgress(fingerprint);
  try {
    return JSON.parse(raw) as ProgressRecord;
  } catch {
    return createEmptyProgress(fingerprint);
  }
}

export async function saveProgress(kv: KvStore, progress: ProgressRecord): Promise<void> {
  await kv.put(progressKey(progress.fingerprint), JSON.stringify(progress));
}

const FINAL_CHAPTER_ID = "ch5";
const PERSISTENCE_ATTEMPT_THRESHOLD = 5;
const FIRST_COMPLETED_CHALLENGE_COUNT = 1;
const DAILY_RETURN_BONUS_XP = 25;
const FIRST_ATTEMPT_XP = 50;
const SECOND_ATTEMPT_XP = 35;
const DEFAULT_ATTEMPT_XP = 20;
const SECOND_ATTEMPT_NUMBER = 2;

function todayDate(isoString: string): string {
  return isoString.slice(0, 10);
}

function baseXpForAttempt(attemptNumber: number): number {
  if (attemptNumber === FIRST_ATTEMPT_NUMBER) return FIRST_ATTEMPT_XP;
  if (attemptNumber === SECOND_ATTEMPT_NUMBER) return SECOND_ATTEMPT_XP;
  return DEFAULT_ATTEMPT_XP;
}

function computeStreakDays(
  current: ProgressRecord,
  shouldReset: boolean,
  nowDay: string,
  lastDay: string
): number {
  if (shouldReset) return 1;
  if (nowDay !== lastDay) return current.streakDays + 1;
  return current.streakDays;
}

function detectChallengeTypeAchievements(
  prev: ProgressRecord,
  next: ProgressRecord,
  challengeType: string
): string[] {
  const earned: string[] = [];
  const has = (id: string): boolean => prev.achievements.includes(id);

  if (!has("first_lesson") && next.completedChallenges.length === FIRST_COMPLETED_CHALLENGE_COUNT) {
    earned.push("first_lesson");
  }
  if (!has("first_signature") && challengeType === "sign") {
    earned.push("first_signature");
  }
  if (!has("first_verification") && challengeType === "verify") {
    earned.push("first_verification");
  }
  if (!has("first_encryption") && challengeType === "encrypt") {
    earned.push("first_encryption");
  }
  if (!has("first_decryption") && challengeType === "decrypt") {
    earned.push("first_decryption");
  }

  return earned;
}

function detectChapterAchievements(
  prev: ProgressRecord,
  chapterId: string,
  allChaptersComplete: boolean,
  perfectChapter: boolean
): string[] {
  const earned: string[] = [];
  const has = (id: string): boolean => prev.achievements.includes(id);

  const chapterAchievement = `${chapterId}_complete`;
  if (!has(chapterAchievement)) earned.push(chapterAchievement);
  if (allChaptersComplete && !has("all_chapters_complete")) {
    earned.push("all_chapters_complete");
  }
  if (chapterId === FINAL_CHAPTER_ID && !has("graduate")) {
    earned.push("graduate");
  }
  if (perfectChapter && !has("perfect_run")) {
    earned.push("perfect_run");
  }

  return earned;
}

function detectAchievements(params: {
  prev: ProgressRecord;
  next: ProgressRecord;
  challengeType: string;
  chapterId: string;
  chapterJustCompleted: boolean;
  allChaptersComplete: boolean;
  perfectChapter: boolean;
  attemptNumber: number;
}): string[] {
  const {
    prev,
    next,
    challengeType,
    chapterId,
    chapterJustCompleted,
    allChaptersComplete,
    perfectChapter,
    attemptNumber
  } = params;
  const has = (id: string): boolean => prev.achievements.includes(id);

  const earned = detectChallengeTypeAchievements(prev, next, challengeType);

  if (chapterJustCompleted) {
    earned.push(...detectChapterAchievements(prev, chapterId, allChaptersComplete, perfectChapter));
  }

  if (attemptNumber >= PERSISTENCE_ATTEMPT_THRESHOLD && !has("persistence")) {
    earned.push("persistence");
  }

  return earned;
}

const CHAPTER_COMPLETION_XP = 200;
const NO_HINT_BONUS_XP = 100;
const PERFECT_CHAPTER_BONUS_XP = 150;
const FIRST_ATTEMPT_NUMBER = 1;

function calculateChapterXpBonus(
  chapter: Chapter,
  challengeId: string,
  current: ProgressRecord,
  hintsUsed: number,
  attemptNumber: number
): number {
  let bonus = CHAPTER_COMPLETION_XP;

  const allChallengesInChapter = chapter.lessons.flatMap((l) => l.challenges);
  const prevChallengeDoneCount = allChallengesInChapter.filter(
    (c) => c.id !== challengeId && current.completedChallenges.includes(c.id)
  ).length;

  if (hintsUsed === 0 && prevChallengeDoneCount === allChallengesInChapter.length - 1) {
    bonus += NO_HINT_BONUS_XP;
  }

  if (attemptNumber === FIRST_ATTEMPT_NUMBER) {
    bonus += PERFECT_CHAPTER_BONUS_XP;
  }

  return bonus;
}

export async function completeChallenge(params: {
  kv: KvStore;
  fingerprint: string;
  challengeId: string;
  lessonId: string;
  chapterId: string;
  challengeType: string;
  hintsUsed: number;
  attemptNumber: number;
  chapters: readonly Chapter[];
  nowIso: string;
}): Promise<{ progress: ProgressRecord; newAchievements: string[]; xpAwarded: number }> {
  const {
    kv,
    fingerprint,
    challengeId,
    lessonId,
    chapterId,
    challengeType,
    attemptNumber,
    chapters,
    nowIso
  } = params;

  const current = await getProgress(kv, fingerprint);

  // Idempotent: already completed
  if (current.completedChallenges.includes(challengeId)) {
    return { progress: current, newAchievements: [], xpAwarded: 0 };
  }

  let xp = baseXpForAttempt(attemptNumber);

  // Daily return bonus
  const nowDay = todayDate(nowIso);
  const lastDay = todayDate(current.lastActivityAt);
  if (nowDay !== lastDay) xp += DAILY_RETURN_BONUS_XP;

  const updatedChallenges = [...current.completedChallenges, challengeId];
  const updatedLessons = current.completedLessons?.includes(lessonId)
    ? (current.completedLessons as string[])
    : [...(current.completedLessons ?? []), lessonId];

  // Find the chapter in the curriculum
  const chapter = chapters.find((c) => c.id === chapterId);
  const chapterJustCompleted =
    chapter !== undefined &&
    chapter.lessons.every((l) =>
      l.challenges.every((c) => c.id === challengeId || updatedChallenges.includes(c.id))
    );

  if (chapterJustCompleted && chapter) {
    xp += calculateChapterXpBonus(chapter, challengeId, current, params.hintsUsed, attemptNumber);
  }

  const allChaptersComplete =
    chapterJustCompleted &&
    chapters.every(
      (c) =>
        c.id === chapterId ||
        c.lessons.every((l) => l.challenges.every((ch) => updatedChallenges.includes(ch.id)))
    );

  const newXp = current.xp + xp;
  const newLevel = levelFromXp(newXp);

  // Streak update
  const { shouldReset } = streakStatus(current, nowDay);
  const newStreakDays = computeStreakDays(current, shouldReset, nowDay, lastDay);

  const updated: ProgressRecord = {
    ...current,
    completedChallenges: updatedChallenges,
    completedLessons: updatedLessons,
    xp: newXp,
    level: newLevel,
    lastActivityAt: nowIso,
    streakDays: newStreakDays,
    streakLastDate: nowDay
  };

  const newAchievements = detectAchievements({
    prev: current,
    next: updated,
    challengeType,
    chapterId,
    chapterJustCompleted,
    allChaptersComplete,
    perfectChapter: chapterJustCompleted && attemptNumber === FIRST_ATTEMPT_NUMBER,
    attemptNumber
  });

  const withAchievements: ProgressRecord = {
    ...updated,
    achievements: [...current.achievements, ...newAchievements]
  };

  await saveProgress(kv, withAchievements);

  return { progress: withAchievements, newAchievements, xpAwarded: xp };
}
