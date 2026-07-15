import type { PageServerLoad } from "./$types";
import { getMainKv } from "$lib/server/kv";
import { getProgress } from "$lib/server/progress";
import {
  deriveUnlockedChapters,
  chapterPercent,
  currentLesson,
  levelFromXp,
  levelTitle
} from "$lib/shared/progress-utils";
import { chapters } from "$lib/shared/content/index";

interface ChapterSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly lessonCount: number;
  readonly percentComplete: number;
  readonly status: "locked" | "in-progress" | "completed";
}

interface CurrentLessonLink {
  readonly chapterId: string;
  readonly lessonId: string;
  readonly title: string;
  readonly chapterTitle: string;
}

interface DashboardStats {
  readonly level: number;
  readonly levelTitle: string;
  readonly xp: number;
  readonly xpToNextLevel: number;
  readonly xpInCurrentLevel: number;
  readonly streakDays: number;
  readonly achievementCount: number;
}

export const load: PageServerLoad = async ({ locals, platform }) => {
  const kv = getMainKv(platform);
  const { fingerprint } = locals.user!;
  const progress = await getProgress(kv, fingerprint);
  const unlockedIds = deriveUnlockedChapters(progress, chapters);

  const chapterSummaries: ChapterSummary[] = chapters.map((chapter) => {
    const percent = chapterPercent(progress, chapter);
    const isUnlocked = unlockedIds.includes(chapter.id);
    const isComplete = percent === 100;

    let status: "locked" | "in-progress" | "completed";
    if (!isUnlocked) {
      status = "locked";
    } else if (isComplete) {
      status = "completed";
    } else {
      status = "in-progress";
    }

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      lessonCount: chapter.lessons.length,
      percentComplete: percent,
      status
    };
  });

  let continueLesson: CurrentLessonLink | null = null;
  for (const chapter of chapters) {
    if (!unlockedIds.includes(chapter.id)) {
      continue;
    }
    const lesson = currentLesson(progress, chapter);
    if (lesson) {
      continueLesson = {
        chapterId: chapter.id,
        lessonId: lesson.id,
        title: lesson.title,
        chapterTitle: chapter.title
      };
      break;
    }
  }

  const level = levelFromXp(progress.xp);
  const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 1800, 2800, 4200, 6000, 8500, 12000] as const;
  const EXTRA_LEVEL_XP = 4000;

  let xpFloor: number;
  let xpCeil: number;
  if (level <= LEVEL_THRESHOLDS.length) {
    xpFloor = LEVEL_THRESHOLDS[level - 1] ?? 0;
    xpCeil =
      level < LEVEL_THRESHOLDS.length
        ? (LEVEL_THRESHOLDS[level] ?? 0)
        : progress.xp + EXTRA_LEVEL_XP;
  } else {
    const extraLevels = level - LEVEL_THRESHOLDS.length;
    xpFloor = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + extraLevels * EXTRA_LEVEL_XP;
    xpCeil = xpFloor + EXTRA_LEVEL_XP;
  }

  const stats: DashboardStats = {
    level,
    levelTitle: levelTitle(level),
    xp: progress.xp,
    xpToNextLevel: xpCeil - xpFloor,
    xpInCurrentLevel: progress.xp - xpFloor,
    streakDays: progress.streakDays,
    achievementCount: progress.achievements.length
  };

  return {
    chapterSummaries,
    continueLesson,
    stats
  };
};
