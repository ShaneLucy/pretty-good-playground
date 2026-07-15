import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { getMainKv } from "$lib/server/kv";
import { getProgress, completeChallenge } from "$lib/server/progress";
import { deriveUnlockedChapters } from "$lib/shared/progress-utils";
import { rateLimit } from "$lib/server/rate-limit";
import { writeFlash } from "$lib/server/flash";
import { readPublicKey, verifySignature } from "$lib/server/pgp";
import { chapters } from "$lib/shared/content/index";
import type { ChallengeSetup } from "$lib/shared/types";

const DASHBOARD_PATH = "/dashboard";
const RATE_LIMIT_ENDPOINT = "submit";
const SUBMIT_RATE_LIMIT = 20;
const CORRECT_RESULT = "correct";
const INCORRECT_RESULT = "incorrect";

/**
 * Strips server-only fields from ChallengeSetup before sending to the client.
 * quiz.correctOption and decrypt (expectedPlaintext) are never exposed.
 */
type SafeChallengeSetup =
  | { readonly type: "sign"; readonly plaintext: string }
  | { readonly type: "verify"; readonly signedMessage: string }
  | { readonly type: "encrypt"; readonly plaintext: string; readonly recipientPublicKey: string }
  | { readonly type: "decrypt"; readonly ciphertext: string }
  | { readonly type: "quiz"; readonly question: string; readonly options: readonly string[] }
  | { readonly type: "explainer"; readonly content: string };

function sanitizeSetup(setup: ChallengeSetup): SafeChallengeSetup {
  switch (setup.type) {
    case "sign":
      return { type: "sign", plaintext: setup.plaintext };
    case "verify":
      return { type: "verify", signedMessage: setup.signedMessage };
    case "encrypt":
      return {
        type: "encrypt",
        plaintext: setup.plaintext,
        recipientPublicKey: setup.recipientPublicKey
      };
    case "decrypt":
      return { type: "decrypt", ciphertext: setup.ciphertext };
    case "quiz":
      return { type: "quiz", question: setup.question, options: setup.options };
    case "explainer":
      return { type: "explainer", content: setup.content };
  }
}

interface ChallengeSummary {
  readonly id: string;
  readonly hint?: string;
  readonly setup: SafeChallengeSetup;
  readonly completed: boolean;
}

interface LessonPageData {
  readonly chapterId: string;
  readonly lessonId: string;
  readonly chapterTitle: string;
  readonly lessonTitle: string;
  readonly lessonDescription: string;
  readonly challenges: ChallengeSummary[];
  readonly completedCount: number;
  readonly lastResult: "correct" | "incorrect" | null;
  readonly lastMessage: string | null;
  readonly xpAwarded: number;
}

export const load: PageServerLoad = async ({
  params,
  locals,
  platform,
  url
}): Promise<LessonPageData> => {
  const chapter = chapters.find((c) => c.id === params.chapterId);
  if (!chapter) {
    error(404, "Chapter not found");
  }

  const lesson = chapter.lessons.find((l) => l.id === params.lessonId);
  if (!lesson) {
    error(404, "Lesson not found");
  }

  const kv = getMainKv(platform);
  const { fingerprint } = locals.user!;
  const progress = await getProgress(kv, fingerprint);
  const unlockedIds = deriveUnlockedChapters(progress, chapters);

  if (!unlockedIds.includes(chapter.id)) {
    redirect(303, DASHBOARD_PATH);
  }

  const rawResult = url.searchParams.get("result");
  const lastResult =
    rawResult === CORRECT_RESULT || rawResult === INCORRECT_RESULT ? rawResult : null;
  const lastMessage = url.searchParams.get("message");
  const rawXp = url.searchParams.get("xp");
  const xpAwarded = rawXp !== null ? parseInt(rawXp, 10) || 0 : 0;

  const challengeSummaries: ChallengeSummary[] = lesson.challenges.map((challenge) => ({
    id: challenge.id,
    hint: challenge.hint,
    setup: sanitizeSetup(challenge.setup),
    completed: progress.completedChallenges.includes(challenge.id)
  }));

  const completedCount = challengeSummaries.filter((c) => c.completed).length;

  return {
    chapterId: chapter.id,
    lessonId: lesson.id,
    chapterTitle: chapter.title,
    lessonTitle: lesson.title,
    lessonDescription: lesson.description,
    challenges: challengeSummaries,
    completedCount,
    lastResult,
    lastMessage,
    xpAwarded
  };
};

interface GradeResult {
  correct: boolean;
  message: string;
}

async function gradeSign(formData: FormData, userPublicKey: string): Promise<GradeResult> {
  const signatureRaw = formData.get("signature");
  if (typeof signatureRaw !== "string" || signatureRaw.trim().length === 0) {
    return { correct: false, message: "Please paste your signed output." };
  }
  try {
    const publicKey = await readPublicKey(userPublicKey);
    const result = await verifySignature({
      armoredSignedMessage: signatureRaw.trim(),
      publicKey
    });
    return {
      correct: result.valid,
      message: result.valid
        ? "Signature verified. Your private key signed this correctly."
        : "Signature verification failed. Make sure you signed with the correct private key."
    };
  } catch {
    return {
      correct: false,
      message: "Could not verify the signature. Check the format and try again."
    };
  }
}

function gradeVerify(formData: FormData): GradeResult {
  const submitted = formData.get("signature");
  if (typeof submitted !== "string" || submitted.trim().length === 0) {
    return { correct: false, message: "Please confirm verification by submitting." };
  }
  return {
    correct: true,
    message:
      "Good work. Verifying signatures confirms both the signer's identity and message integrity."
  };
}

async function gradeEncrypt(
  formData: FormData,
  setup: Extract<ChallengeSetup, { type: "encrypt" }>,
  platform: App.Platform | undefined
): Promise<GradeResult> {
  const ciphertextRaw = formData.get("ciphertext");
  if (typeof ciphertextRaw !== "string" || ciphertextRaw.trim().length === 0) {
    return { correct: false, message: "Please paste your encrypted output." };
  }
  if (!platform) {
    const looksLikePgp = ciphertextRaw.includes("-----BEGIN PGP MESSAGE-----");
    return {
      correct: looksLikePgp,
      message: looksLikePgp
        ? "Encryption accepted."
        : "That does not look like a PGP message block. Include the entire output."
    };
  }
  return gradeEncryptWithPlatform(ciphertextRaw.trim(), setup.plaintext, platform);
}

async function gradeEncryptWithPlatform(
  ciphertext: string,
  expectedPlaintext: string,
  platform: App.Platform
): Promise<GradeResult> {
  try {
    const { readMessage, decryptKey, readPrivateKey, decrypt } = await import("openpgp");
    const encryptedPrivateKey = await readPrivateKey({
      armoredKey: platform.env.CHALLENGE_PRIVATE_KEY
    });
    const decryptedPrivateKey = await decryptKey({
      privateKey: encryptedPrivateKey,
      passphrase: platform.env.CHALLENGE_KEY_PASSPHRASE
    });
    const message = await readMessage({ armoredMessage: ciphertext });
    const { data } = await decrypt({ message, decryptionKeys: decryptedPrivateKey });
    const isCorrect = (data as string).trim() === expectedPlaintext.trim();
    return {
      correct: isCorrect,
      message: isCorrect
        ? "The server decrypted your message and it matched. Excellent."
        : "The decrypted message did not match. Expected the original plaintext."
    };
  } catch {
    return {
      correct: false,
      message: "Could not decrypt the ciphertext. Make sure you encrypted to the correct key."
    };
  }
}

function gradeDecrypt(
  formData: FormData,
  setup: Extract<ChallengeSetup, { type: "decrypt" }>
): GradeResult {
  const plaintextRaw = formData.get("plaintext");
  if (typeof plaintextRaw !== "string" || plaintextRaw.trim().length === 0) {
    return { correct: false, message: "Please paste the decrypted message." };
  }
  const isCorrect = plaintextRaw.trim() === setup.ciphertext.trim();
  return {
    correct: isCorrect,
    message: isCorrect
      ? "Correct! You decrypted the message."
      : "That does not match the expected plaintext. Try again."
  };
}

function gradeQuiz(
  formData: FormData,
  setup: Extract<ChallengeSetup, { type: "quiz" }>
): GradeResult {
  const selectedRaw = formData.get("selectedOption");
  if (typeof selectedRaw !== "string") {
    return { correct: false, message: "Please select an answer." };
  }
  const selected = parseInt(selectedRaw, 10);
  if (Number.isNaN(selected)) {
    return { correct: false, message: "Please select an answer." };
  }
  const isCorrect = selected === setup.correctOption;
  return {
    correct: isCorrect,
    message: isCorrect
      ? "Correct! Well done."
      : "Not quite. Review the lesson content and try again."
  };
}

async function gradeChallenge(params: {
  setup: ChallengeSetup;
  formData: FormData;
  platform: App.Platform | undefined;
  userPublicKey: string;
}): Promise<GradeResult> {
  const { setup, formData, platform, userPublicKey } = params;

  switch (setup.type) {
    case "explainer":
      return { correct: true, message: "Marked as complete." };
    case "quiz":
      return gradeQuiz(formData, setup);
    case "sign":
      return gradeSign(formData, userPublicKey);
    case "verify":
      return gradeVerify(formData);
    case "encrypt":
      return gradeEncrypt(formData, setup, platform);
    case "decrypt":
      return gradeDecrypt(formData, setup);
  }
}

function parseChallengeFormFields(formData: FormData): {
  challengeId: string | null;
  hintsUsed: number;
  attemptNumber: number;
} {
  const challengeId = formData.get("challengeId");
  const hintsUsedRaw = formData.get("hintsUsed");
  const attemptNumberRaw = formData.get("attemptNumber");

  return {
    challengeId: typeof challengeId === "string" ? challengeId.trim() : null,
    hintsUsed: hintsUsedRaw !== null ? parseInt(hintsUsedRaw as string, 10) || 0 : 0,
    attemptNumber: attemptNumberRaw !== null ? parseInt(attemptNumberRaw as string, 10) || 1 : 1
  };
}

function buildRedirectUrl(
  chapterId: string,
  lessonId: string,
  result: string,
  message: string,
  xp?: number
): string {
  const base = `/learn/${chapterId}/${lessonId}`;
  const encoded = encodeURIComponent(message);
  const xpParam = xp !== undefined ? `&xp=${xp}` : "";
  return `${base}?result=${result}&message=${encoded}${xpParam}`;
}

export const actions: Actions = {
  submit: async ({ request, params, locals, platform }) => {
    const formData = await request.formData();
    const { challengeId, hintsUsed, attemptNumber } = parseChallengeFormFields(formData);

    if (!challengeId) {
      return fail(400, { error: "Missing challenge ID." });
    }

    if (!platform) {
      redirect(
        303,
        buildRedirectUrl(params.chapterId, params.lessonId, CORRECT_RESULT, "Completed", 50)
      );
    }

    const { fingerprint } = locals.user!;
    const kv = getMainKv(platform);

    const { allowed } = await rateLimit(kv, RATE_LIMIT_ENDPOINT, fingerprint, SUBMIT_RATE_LIMIT);
    if (!allowed) {
      return fail(429, { error: "Too many submissions. Please wait a moment." });
    }

    const chapter = chapters.find((c) => c.id === params.chapterId);
    if (!chapter) {
      return fail(404, { error: "Chapter not found." });
    }

    const lesson = chapter.lessons.find((l) => l.id === params.lessonId);
    if (!lesson) {
      return fail(404, { error: "Lesson not found." });
    }

    const challenge = lesson.challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      return fail(404, { error: "Challenge not found." });
    }

    const gradeResult = await gradeChallenge({
      setup: challenge.setup,
      formData,
      platform,
      userPublicKey: locals.user!.publicKey
    });

    if (!gradeResult.correct) {
      redirect(
        303,
        buildRedirectUrl(params.chapterId, params.lessonId, INCORRECT_RESULT, gradeResult.message)
      );
    }

    const { xpAwarded, newAchievements } = await completeChallenge({
      kv,
      fingerprint,
      challengeId,
      lessonId: lesson.id,
      chapterId: chapter.id,
      challengeType: challenge.setup.type,
      hintsUsed,
      attemptNumber,
      chapters,
      nowIso: new Date().toISOString()
    });

    if (newAchievements.length > 0) {
      const firstAchievement = newAchievements[0] ?? "achievement";
      await writeFlash(kv, fingerprint, {
        type: "success",
        message: `Achievement unlocked: ${firstAchievement.replace(/_/g, " ")}`
      });
    }

    redirect(
      303,
      buildRedirectUrl(
        params.chapterId,
        params.lessonId,
        CORRECT_RESULT,
        gradeResult.message,
        xpAwarded
      )
    );
  }
};
