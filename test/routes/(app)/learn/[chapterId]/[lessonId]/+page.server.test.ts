import { describe, it, expect } from "vitest";
import {
  load,
  actions
} from "../../../../../../src/routes/(app)/learn/[chapterId]/[lessonId]/+page.server";
import type { KvStore } from "$lib/server/kv";
import { rateLimitKey, progressKey } from "$lib/server/kv";
import { chapters } from "$lib/shared/content/index";
import type { ProgressRecord } from "$lib/shared/types";

const TEST_FINGERPRINT = "TESTFP";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY = "pk";
const CHAPTER_ONE_ID = "ch1";
const CHAPTER_TWO_ID = "ch2";
const CHAPTER_THREE_ID = "ch3";
const UNKNOWN_CHAPTER_ID = "ch999";
const UNKNOWN_LESSON_ID = "l999";
const DASHBOARD_PATH = "/dashboard";
const RESULT_CORRECT = "correct";
const RESULT_INCORRECT = "incorrect";
const RESULT_INVALID = "invalid";
const XP_AWARDED_FROM_URL = 50;
const LAST_MESSAGE_FROM_URL = "great";
const RATE_LIMIT_ENDPOINT = "submit";
const RATE_LIMIT_COUNT = 20;
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const STATUS_TOO_MANY_REQUESTS = 429;
const LESSON_CH1_QUIZ = "ch1-l2";
const CHALLENGE_CH1_QUIZ = "ch1-l2-c1";
const LESSON_CH2_SIGN = "ch2-l2";
const CHALLENGE_CH2_SIGN = "ch2-l2-c1";
const LESSON_CH2_VERIFY = "ch2-l3";
const CHALLENGE_CH2_VERIFY = "ch2-l3-c1";
const LESSON_CH3_ENCRYPT = "ch3-l2";
const LESSON_CH3_DECRYPT = "ch3-l3";
const CHALLENGE_CH3_DECRYPT = "ch3-l3-c1";
const SELECTED_OPTION_CORRECT = "0";
const SELECTED_OPTION_WRONG = "2";
const SIGNATURE_FIELD = "verified";
const LAST_ACTIVITY_AT = "2024-01-01T00:00:00.000Z";

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

function makePlatform(mainKv: KvStore): App.Platform {
  return {
    env: {
      MAIN_KV: mainKv as unknown as App.Platform["env"]["MAIN_KV"],
      EPHEMERAL_KV: {} as App.Platform["env"]["EPHEMERAL_KV"],
      JWT_SECRET: "test-secret",
      CHALLENGE_PRIVATE_KEY: "",
      CHALLENGE_KEY_PASSPHRASE: ""
    },
    ctx: {} as App.Platform["ctx"],
    context: {} as App.Platform["context"],
    caches: {} as App.Platform["caches"]
  };
}

function makeLocals(fingerprint = TEST_FINGERPRINT, publicKey = TEST_PUBLIC_KEY): App.Locals {
  return {
    user: {
      fingerprint,
      displayName: TEST_DISPLAY_NAME,
      publicKey
    },
    flash: null
  };
}

async function captureRedirect(fn: () => unknown): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (typeof e === "object" && e !== null && "location" in e) {
      return (e as { location: string }).location;
    }
    return null;
  }
}

async function captureHttpError(fn: () => unknown): Promise<number | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (typeof e === "object" && e !== null && "status" in e) {
      return (e as { status: number }).status;
    }
    return null;
  }
}

function makeSubmitEvent(
  params: { chapterId: string; lessonId: string },
  formData: FormData,
  kv: KvStore,
  fingerprint = TEST_FINGERPRINT
): Parameters<typeof actions.submit>[0] {
  return {
    request: new Request("http://localhost/submit", { method: "POST", body: formData }),
    params,
    locals: makeLocals(fingerprint),
    platform: makePlatform(kv)
  } as unknown as Parameters<typeof actions.submit>[0];
}

const chapter1 = chapters.find((c) => c.id === CHAPTER_ONE_ID)!;
const lesson1 = chapter1.lessons[0]!;
const lesson1Id = lesson1.id;
const challenge1Id = lesson1.challenges[0]!.id;

describe("load", () => {
  it("returns 404 for unknown chapterId", async () => {
    const kv = createInMemoryKv();

    const status = await captureHttpError(() =>
      load({
        params: { chapterId: UNKNOWN_CHAPTER_ID, lessonId: "l1" },
        locals: makeLocals(),
        platform: makePlatform(kv),
        url: new URL("http://localhost/learn/ch999/l1")
      } as unknown as Parameters<typeof load>[0])
    );

    expect(status).toBe(STATUS_NOT_FOUND);
  });

  it("returns 404 for unknown lessonId", async () => {
    const kv = createInMemoryKv();

    const status = await captureHttpError(() =>
      load({
        params: { chapterId: CHAPTER_ONE_ID, lessonId: UNKNOWN_LESSON_ID },
        locals: makeLocals(),
        platform: makePlatform(kv),
        url: new URL(`http://localhost/learn/${CHAPTER_ONE_ID}/${UNKNOWN_LESSON_ID}`)
      } as unknown as Parameters<typeof load>[0])
    );

    expect(status).toBe(STATUS_NOT_FOUND);
  });

  it("redirects to /dashboard when chapter is locked", async () => {
    const kv = createInMemoryKv();
    const chapter2 = chapters.find((c) => c.id === CHAPTER_TWO_ID)!;
    const ch2Lesson1Id = chapter2.lessons[0]!.id;

    const location = await captureRedirect(() =>
      load({
        params: { chapterId: CHAPTER_TWO_ID, lessonId: ch2Lesson1Id },
        locals: makeLocals(),
        platform: makePlatform(kv),
        url: new URL(`http://localhost/learn/${CHAPTER_TWO_ID}/${ch2Lesson1Id}`)
      } as unknown as Parameters<typeof load>[0])
    );

    expect(location).toBe(DASHBOARD_PATH);
  });

  it("returns lesson page data for a valid lesson", async () => {
    const kv = createInMemoryKv();

    const result = await load({
      params: { chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url: new URL(`http://localhost/learn/${CHAPTER_ONE_ID}/${lesson1Id}`)
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({
      chapterId: CHAPTER_ONE_ID,
      lessonId: lesson1Id,
      challenges: expect.any(Array),
      completedCount: 0,
      lastResult: null
    });
  });

  it("reads lastResult from url searchParams", async () => {
    const kv = createInMemoryKv();
    const url = new URL(
      `http://localhost/learn/${CHAPTER_ONE_ID}/${lesson1Id}?result=${RESULT_CORRECT}&message=${LAST_MESSAGE_FROM_URL}&xp=${XP_AWARDED_FROM_URL}`
    );

    const result = await load({
      params: { chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({ lastResult: RESULT_CORRECT, xpAwarded: XP_AWARDED_FROM_URL });
  });

  it("ignores invalid result values from url", async () => {
    const kv = createInMemoryKv();
    const url = new URL(
      `http://localhost/learn/${CHAPTER_ONE_ID}/${lesson1Id}?result=${RESULT_INVALID}`
    );

    const result = await load({
      params: { chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toMatchObject({ lastResult: null });
  });
});

describe("submit action", () => {
  it("returns 400 when challengeId is missing", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    const event = makeSubmitEvent({ chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id }, fd, kv);

    const result = await actions.submit(event);

    expect(result).toMatchObject({ status: STATUS_BAD_REQUEST });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    const store = new Map<string, string>();
    store.set(
      rateLimitKey(RATE_LIMIT_ENDPOINT, TEST_FINGERPRINT, minute),
      String(RATE_LIMIT_COUNT)
    );
    const kv = createInMemoryKv(store);

    const fd = new FormData();
    fd.append("challengeId", challenge1Id);
    const event = makeSubmitEvent({ chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id }, fd, kv);

    const result = await actions.submit(event);

    expect(result).toMatchObject({ status: STATUS_TOO_MANY_REQUESTS });
  });

  it("returns 404 when chapter not found", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    fd.append("challengeId", challenge1Id);
    const event = makeSubmitEvent({ chapterId: UNKNOWN_CHAPTER_ID, lessonId: lesson1Id }, fd, kv);

    const result = await actions.submit(event);

    expect(result).toMatchObject({ status: STATUS_NOT_FOUND });
  });

  it("returns 404 when lesson not found", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    fd.append("challengeId", challenge1Id);
    const event = makeSubmitEvent(
      { chapterId: CHAPTER_ONE_ID, lessonId: UNKNOWN_LESSON_ID },
      fd,
      kv
    );

    const result = await actions.submit(event);

    expect(result).toMatchObject({ status: STATUS_NOT_FOUND });
  });

  it("returns 404 when challenge not found", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    fd.append("challengeId", "ch1-l1-c999");
    const event = makeSubmitEvent({ chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id }, fd, kv);

    const result = await actions.submit(event);

    expect(result).toMatchObject({ status: STATUS_NOT_FOUND });
  });

  it("redirects to /learn/ch1/ path when platform is undefined (no-platform path)", async () => {
    const fd = new FormData();
    fd.append("challengeId", challenge1Id);
    const request = new Request("http://localhost/submit", { method: "POST", body: fd });

    const event = {
      request,
      params: { chapterId: CHAPTER_ONE_ID, lessonId: lesson1Id },
      locals: makeLocals(),
      platform: undefined
    } as unknown as Parameters<typeof actions.submit>[0];

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`/learn/${CHAPTER_ONE_ID}/`);
  });
});

function buildProgressRecord(
  fingerprint: string,
  completedChallenges: string[],
  overrides: Partial<ProgressRecord> = {}
): ProgressRecord {
  return {
    fingerprint,
    completedChallenges,
    xp: 0,
    level: 1,
    achievements: [],
    lastActivityAt: LAST_ACTIVITY_AT,
    streakDays: 0,
    completedLessons: [],
    ...overrides
  };
}

function getCh1AllChallengeIds(): string[] {
  const chapter1 = chapters.find((c) => c.id === CHAPTER_ONE_ID)!;
  return chapter1.lessons.flatMap((l) => l.challenges.map((c) => c.id));
}

function getCh1Ch2AllChallengeIds(): string[] {
  return chapters
    .filter((c) => c.id === CHAPTER_ONE_ID || c.id === CHAPTER_TWO_ID)
    .flatMap((ch) => ch.lessons.flatMap((l) => l.challenges.map((c) => c.id)));
}

describe("load — sanitizeSetup", () => {
  it("covers quiz setup type — strips correctOption from the returned setup", async () => {
    const kv = createInMemoryKv();

    const result = await load({
      params: { chapterId: CHAPTER_ONE_ID, lessonId: LESSON_CH1_QUIZ },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url: new URL(`http://localhost/learn/${CHAPTER_ONE_ID}/${LESSON_CH1_QUIZ}`)
    } as unknown as Parameters<typeof load>[0]);

    if (!result) {
      throw new Error("Expected load to return data");
    }
    const setup = result.challenges[0]!.setup;
    expect(setup.type).toBe("quiz");
    expect(setup).not.toHaveProperty("correctOption");
  });

  it("covers sign setup type — returns setup with type sign", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      params: { chapterId: CHAPTER_TWO_ID, lessonId: LESSON_CH2_SIGN },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url: new URL(`http://localhost/learn/${CHAPTER_TWO_ID}/${LESSON_CH2_SIGN}`)
    } as unknown as Parameters<typeof load>[0]);

    if (!result) {
      throw new Error("Expected load to return data");
    }
    expect(result.challenges[0]!.setup.type).toBe("sign");
  });

  it("covers verify setup type — returns setup with type verify", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      params: { chapterId: CHAPTER_TWO_ID, lessonId: LESSON_CH2_VERIFY },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url: new URL(`http://localhost/learn/${CHAPTER_TWO_ID}/${LESSON_CH2_VERIFY}`)
    } as unknown as Parameters<typeof load>[0]);

    if (!result) {
      throw new Error("Expected load to return data");
    }
    expect(result.challenges[0]!.setup.type).toBe("verify");
  });

  it("covers encrypt setup type — returns setup with type encrypt", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1Ch2AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      params: { chapterId: CHAPTER_THREE_ID, lessonId: LESSON_CH3_ENCRYPT },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url: new URL(`http://localhost/learn/${CHAPTER_THREE_ID}/${LESSON_CH3_ENCRYPT}`)
    } as unknown as Parameters<typeof load>[0]);

    if (!result) {
      throw new Error("Expected load to return data");
    }
    expect(result.challenges[0]!.setup.type).toBe("encrypt");
  });

  it("covers decrypt setup type — returns setup with type decrypt", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1Ch2AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);

    const result = await load({
      params: { chapterId: CHAPTER_THREE_ID, lessonId: LESSON_CH3_DECRYPT },
      locals: makeLocals(),
      platform: makePlatform(kv),
      url: new URL(`http://localhost/learn/${CHAPTER_THREE_ID}/${LESSON_CH3_DECRYPT}`)
    } as unknown as Parameters<typeof load>[0]);

    if (!result) {
      throw new Error("Expected load to return data");
    }
    expect(result.challenges[0]!.setup.type).toBe("decrypt");
  });
});

describe("submit action — grading", () => {
  it("quiz — correct answer redirects to correct result", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH1_QUIZ);
    fd.append("selectedOption", SELECTED_OPTION_CORRECT);
    fd.append("hintsUsed", "0");
    fd.append("attemptNumber", "1");
    const event = makeSubmitEvent({ chapterId: CHAPTER_ONE_ID, lessonId: LESSON_CH1_QUIZ }, fd, kv);

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_CORRECT}`);
  });

  it("quiz — incorrect answer redirects to incorrect result", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH1_QUIZ);
    fd.append("selectedOption", SELECTED_OPTION_WRONG);
    fd.append("hintsUsed", "0");
    fd.append("attemptNumber", "1");
    const event = makeSubmitEvent({ chapterId: CHAPTER_ONE_ID, lessonId: LESSON_CH1_QUIZ }, fd, kv);

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_INCORRECT}`);
  });

  it("quiz — missing selectedOption redirects to incorrect result", async () => {
    const kv = createInMemoryKv();
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH1_QUIZ);
    const event = makeSubmitEvent({ chapterId: CHAPTER_ONE_ID, lessonId: LESSON_CH1_QUIZ }, fd, kv);

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_INCORRECT}`);
  });

  it("gradeVerify — any non-empty signature is accepted as correct", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH2_VERIFY);
    fd.append("signature", SIGNATURE_FIELD);
    fd.append("hintsUsed", "0");
    fd.append("attemptNumber", "1");
    const event = makeSubmitEvent(
      { chapterId: CHAPTER_TWO_ID, lessonId: LESSON_CH2_VERIFY },
      fd,
      kv
    );

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_CORRECT}`);
  });

  it("gradeDecrypt — empty plaintext redirects to incorrect result", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1Ch2AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH3_DECRYPT);
    fd.append("hintsUsed", "0");
    fd.append("attemptNumber", "1");
    const event = makeSubmitEvent(
      { chapterId: CHAPTER_THREE_ID, lessonId: LESSON_CH3_DECRYPT },
      fd,
      kv
    );

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_INCORRECT}`);
  });

  it("gradeSign — empty signature redirects to incorrect result", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH2_SIGN);
    fd.append("hintsUsed", "0");
    fd.append("attemptNumber", "1");
    const event = makeSubmitEvent({ chapterId: CHAPTER_TWO_ID, lessonId: LESSON_CH2_SIGN }, fd, kv);

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_INCORRECT}`);
  });

  it("gradeSign — invalid PGP signature redirects to incorrect result", async () => {
    const store = new Map<string, string>();
    store.set(
      progressKey(TEST_FINGERPRINT),
      JSON.stringify(buildProgressRecord(TEST_FINGERPRINT, getCh1AllChallengeIds()))
    );
    const kv = createInMemoryKv(store);
    const fd = new FormData();
    fd.append("challengeId", CHALLENGE_CH2_SIGN);
    fd.append("signature", "not-a-pgp-signature");
    fd.append("hintsUsed", "0");
    fd.append("attemptNumber", "1");
    const event = makeSubmitEvent({ chapterId: CHAPTER_TWO_ID, lessonId: LESSON_CH2_SIGN }, fd, kv);

    const location = await captureRedirect(() => actions.submit(event));

    expect(location).not.toBeNull();
    expect(location).toContain(`result=${RESULT_INCORRECT}`);
  });
});
