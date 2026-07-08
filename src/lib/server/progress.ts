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

function todayDate(isoString: string): string {
  return isoString.slice(0, 10);
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
  const earned: string[] = [];
  const has = (id: string): boolean => prev.achievements.includes(id);

  if (!has("first_lesson") && next.completedChallenges.length === 1) {
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
  if (chapterJustCompleted) {
    const chapterAchievement = `${chapterId}_complete`;
    if (!has(chapterAchievement)) earned.push(chapterAchievement);
    if (allChaptersComplete && !has("all_chapters_complete")) {
      earned.push("all_chapters_complete");
    }
    if (chapterId === "ch5" && !has("graduate")) {
      earned.push("graduate");
    }
    if (perfectChapter && !has("perfect_run")) {
      earned.push("perfect_run");
    }
  }
  if (attemptNumber >= 5 && !has("persistence")) {
    earned.push("persistence");
  }

  return earned;
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

  let xp = attemptNumber === 1 ? 50 : attemptNumber === 2 ? 35 : 20;

  // Daily return bonus
  const nowDay = todayDate(nowIso);
  const lastDay = todayDate(current.lastActivityAt);
  if (nowDay !== lastDay) xp += 25;

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
    xp += 200; // chapter completion bonus

    // No-hints bonus: check if user opened no hints across entire chapter
    // (we track hintsUsed per submission; for the chapter bonus we check if this final challenge had none
    // and all previous ones were completed — we optimistically apply the bonus here)
    const allChallengesInChapter = chapter.lessons.flatMap((l) => l.challenges);
    const prevChallengeDone = allChallengesInChapter.filter(
      (c) => c.id !== challengeId && current.completedChallenges.includes(c.id)
    );
    // Simple heuristic: award no-hint bonus if hintsUsed === 0 for this final challenge
    // Full cross-challenge hint tracking would require storing hint state per challenge
    if (params.hintsUsed === 0 && prevChallengeDone.length === allChallengesInChapter.length - 1) {
      xp += 100;
    }

    // Perfect chapter: only if all completed on first attempt
    // We check attemptNumber === 1 as a proxy for the final challenge
    const perfectChapter = attemptNumber === 1;
    if (perfectChapter) xp += 150;
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
  const newStreakDays = shouldReset
    ? 1
    : nowDay !== lastDay
      ? current.streakDays + 1
      : current.streakDays;

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
    perfectChapter: chapterJustCompleted && attemptNumber === 1,
    attemptNumber
  });

  const withAchievements: ProgressRecord = {
    ...updated,
    achievements: [...current.achievements, ...newAchievements]
  };

  await saveProgress(kv, withAchievements);

  return { progress: withAchievements, newAchievements, xpAwarded: xp };
}
