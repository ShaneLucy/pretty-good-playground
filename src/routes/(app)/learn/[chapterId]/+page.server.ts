import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getMainKv } from "$lib/server/kv";
import { getProgress } from "$lib/server/progress";
import { deriveUnlockedChapters } from "$lib/shared/progress-utils";
import { chapters } from "$lib/shared/content/index";

const DASHBOARD_PATH = "/dashboard";

interface LessonSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly challengeCount: number;
  readonly completedChallengeCount: number;
  readonly status: "locked" | "in-progress" | "completed";
}

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const chapter = chapters.find((c) => c.id === params.chapterId);
  if (!chapter) {
    error(404, "Chapter not found");
  }

  const kv = getMainKv(platform);
  const { fingerprint } = locals.user!;
  const progress = await getProgress(kv, fingerprint);
  const unlockedIds = deriveUnlockedChapters(progress, chapters);

  if (!unlockedIds.includes(chapter.id)) {
    redirect(303, DASHBOARD_PATH);
  }

  const lessonSummaries: LessonSummary[] = chapter.lessons.map((lesson, index) => {
    const completedChallengeCount = lesson.challenges.filter((c) =>
      progress.completedChallenges.includes(c.id)
    ).length;
    const isComplete = completedChallengeCount === lesson.challenges.length;

    // A lesson is accessible if it's the first, or the previous lesson is complete
    const prevLesson = index > 0 ? chapter.lessons[index - 1] : null;
    const prevComplete =
      prevLesson === null ||
      prevLesson === undefined ||
      prevLesson.challenges.every((c) => progress.completedChallenges.includes(c.id));

    let status: "locked" | "in-progress" | "completed";
    if (!prevComplete) {
      status = "locked";
    } else if (isComplete) {
      status = "completed";
    } else {
      status = "in-progress";
    }

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      challengeCount: lesson.challenges.length,
      completedChallengeCount,
      status
    };
  });

  return {
    chapter: {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description
    },
    lessonSummaries
  };
};
