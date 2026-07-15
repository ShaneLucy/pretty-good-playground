import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getMainKv, userKey } from "$lib/server/kv";
import { getProgress } from "$lib/server/progress";
import { chapterPercent } from "$lib/shared/progress-utils";
import { chapters } from "$lib/shared/content/index";
import type { UserRecord } from "$lib/shared/types";

const NOT_FOUND_STATUS = 404;
const NOT_FOUND_MESSAGE = "Profile not found.";

interface ChapterProgress {
  readonly id: string;
  readonly title: string;
  readonly percentComplete: number;
}

export const load: PageServerLoad = async ({ params, platform }) => {
  const { fingerprint } = params;
  const kv = getMainKv(platform);

  const [userRaw, progress] = await Promise.all([
    kv.get(userKey(fingerprint)),
    getProgress(kv, fingerprint)
  ]);

  if (!userRaw) {
    throw error(NOT_FOUND_STATUS, NOT_FOUND_MESSAGE);
  }

  const userRecord = JSON.parse(userRaw) as UserRecord;

  if (!userRecord.profilePublic) {
    throw error(NOT_FOUND_STATUS, NOT_FOUND_MESSAGE);
  }

  const chapterProgresses: ChapterProgress[] = chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    percentComplete: chapterPercent(progress, chapter)
  }));

  return {
    displayName: userRecord.displayName,
    fingerprint: userRecord.fingerprint,
    achievements: progress.achievements,
    chapterProgresses,
    xp: progress.xp,
    level: progress.level,
    streakDays: progress.streakDays
  };
};
