import type { Chapter, Lesson, ProgressRecord } from "$lib/shared/types";

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4200, 6000, 8500, 12000] as const;
const LEVEL_TITLES = [
  "Curious Beginner",
  "Key Holder",
  "Apprentice",
  "Signer",
  "Encryptor",
  "Verifier",
  "Web Weaver",
  "Key Custodian",
  "Trusted Signer",
  "Cryptographer"
] as const;

export function levelFromXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      if (i === LEVEL_THRESHOLDS.length - 1) {
        // Level 10+: +4000 per level above 10
        const excess = xp - LEVEL_THRESHOLDS[i];
        return 10 + Math.floor(excess / 4000);
      }
      return i + 1;
    }
  }
  return 1;
}

export function levelTitle(level: number): string {
  if (level <= 0) {
    return LEVEL_TITLES[0];
  }
  if (level <= LEVEL_TITLES.length) {
    return LEVEL_TITLES[level - 1];
  }
  return "Distinguished Cryptographer";
}

function isLessonComplete(progress: ProgressRecord, lesson: Lesson): boolean {
  return lesson.challenges.every((c) => progress.completedChallenges.includes(c.id));
}

function isChapterComplete(progress: ProgressRecord, chapter: Chapter): boolean {
  return chapter.lessons.every((l) => isLessonComplete(progress, l));
}

export function deriveUnlockedChapters(
  progress: ProgressRecord,
  chapters: readonly Chapter[]
): string[] {
  const unlocked: string[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    if (i === 0) {
      unlocked.push(chapter.id);
    } else {
      const prev = chapters[i - 1];
      if (prev && isChapterComplete(progress, prev)) {
        unlocked.push(chapter.id);
      }
    }
  }
  return unlocked;
}

export function chapterPercent(progress: ProgressRecord, chapter: Chapter): number {
  const total = chapter.lessons.reduce((sum, l) => sum + l.challenges.length, 0);
  if (total === 0) {
    return 0;
  }
  const completed = chapter.lessons.reduce(
    (sum, l) =>
      sum + l.challenges.filter((c) => progress.completedChallenges.includes(c.id)).length,
    0
  );
  return Math.round((completed / total) * 100);
}

export function currentLesson(progress: ProgressRecord, chapter: Chapter): Lesson | null {
  for (const lesson of chapter.lessons) {
    if (!isLessonComplete(progress, lesson)) {
      return lesson;
    }
  }
  return null;
}

export function streakStatus(
  progress: ProgressRecord,
  nowDate: string
): { active: boolean; shouldReset: boolean } {
  const lastDate = progress.streakLastDate;
  if (!lastDate) {
    return { active: false, shouldReset: false };
  }

  const now = new Date(nowDate);
  const last = new Date(lastDate);
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { active: true, shouldReset: false };
  }
  if (diffDays === 1) {
    return { active: true, shouldReset: false };
  }
  return { active: false, shouldReset: true };
}
