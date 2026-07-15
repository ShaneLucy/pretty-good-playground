import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { getMainKv, userKey } from "$lib/server/kv";
import { getProgress, saveProgress } from "$lib/server/progress";
import { writeFlash } from "$lib/server/flash";
import { chapterPercent } from "$lib/shared/progress-utils";
import { chapters } from "$lib/shared/content/index";
import type { UserRecord } from "$lib/shared/types";

const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 50;
const DISPLAY_NAME_PATTERN = /^[\w\s]+$/;
const OPEN_BOOK_ACHIEVEMENT = "open_book";
const OPEN_BOOK_FLASH_MESSAGE = "Achievement unlocked: open book";

interface ChapterProgress {
  readonly id: string;
  readonly title: string;
  readonly percentComplete: number;
}

export const load: PageServerLoad = async ({ locals, platform }) => {
  const kv = getMainKv(platform);
  const { fingerprint } = locals.user!;
  const [progress, userRaw] = await Promise.all([
    getProgress(kv, fingerprint),
    kv.get(userKey(fingerprint))
  ]);

  const userRecord = userRaw ? (JSON.parse(userRaw) as UserRecord) : null;

  const chapterProgresses: ChapterProgress[] = chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    percentComplete: chapterPercent(progress, chapter)
  }));

  return {
    displayName: userRecord?.displayName ?? locals.user!.displayName,
    profilePublic: userRecord?.profilePublic ?? false,
    achievements: progress.achievements,
    chapterProgresses,
    xp: progress.xp,
    level: progress.level,
    streakDays: progress.streakDays
  };
};

export const actions: Actions = {
  updateDisplayName: async ({ request, locals, platform }) => {
    const kv = getMainKv(platform);
    const { fingerprint } = locals.user!;

    const formData = await request.formData();
    const displayName = formData.get("displayName");

    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return fail(400, { updateNameError: "Display name is required." });
    }
    if (displayName.trim().length < DISPLAY_NAME_MIN_LENGTH) {
      return fail(400, {
        updateNameError: `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`
      });
    }
    if (displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
      return fail(400, {
        updateNameError: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`
      });
    }
    if (!DISPLAY_NAME_PATTERN.test(displayName.trim())) {
      return fail(400, {
        updateNameError: "Display name may only contain letters, numbers, and spaces."
      });
    }

    const raw = await kv.get(userKey(fingerprint));
    if (!raw) {
      return fail(404, { updateNameError: "Account not found." });
    }

    const record = JSON.parse(raw) as UserRecord;
    const updated: UserRecord = { ...record, displayName: displayName.trim() };
    await kv.put(userKey(fingerprint), JSON.stringify(updated));

    return { updateNameSuccess: true };
  },

  toggleVisibility: async ({ request, locals, platform }) => {
    const kv = getMainKv(platform);
    const { fingerprint } = locals.user!;

    const formData = await request.formData();
    const publicValue = formData.get("public");
    const wantsPublic = publicValue === "on";

    const raw = await kv.get(userKey(fingerprint));
    if (!raw) {
      return fail(404, { visibilityError: "Account not found." });
    }

    const record = JSON.parse(raw) as UserRecord;
    const updated: UserRecord = { ...record, profilePublic: wantsPublic };
    await kv.put(userKey(fingerprint), JSON.stringify(updated));

    if (wantsPublic && !record.profilePublic) {
      const progress = await getProgress(kv, fingerprint);
      if (!progress.achievements.includes(OPEN_BOOK_ACHIEVEMENT)) {
        const updatedProgress = {
          ...progress,
          achievements: [...progress.achievements, OPEN_BOOK_ACHIEVEMENT]
        };
        await saveProgress(kv, updatedProgress);
        await writeFlash(kv, fingerprint, {
          type: "achievement",
          message: OPEN_BOOK_FLASH_MESSAGE
        });
      }
    }

    redirect(303, "/profile");
  }
};
