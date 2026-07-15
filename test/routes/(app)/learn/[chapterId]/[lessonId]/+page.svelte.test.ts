import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../../../../../src/routes/(app)/learn/[chapterId]/[lessonId]/+page.svelte";

const CHAPTER_ID = "ch1";
const LESSON_ID = "l1";
const CHAPTER_TITLE = "Introduction to PGP";
const LESSON_TITLE = "What is PGP?";
const LESSON_DESCRIPTION = "Learn what PGP is and how it works.";
const CHALLENGE_ID_ONE = "ch1-l1-c1";
const USER_FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const USER_DISPLAY_NAME = "Test User";
const USER_PUBLIC_KEY = "pk";
const QUIZ_QUESTION = "What does PGP stand for?";
const QUIZ_OPTION_ONE = "Pretty Good Privacy";
const QUIZ_OPTION_TWO = "Pretty Great Privacy";
const HINT_TEXT = "Think about the name Phil Zimmermann chose.";
const FEEDBACK_MESSAGE = "Correct!";
const RESULT_CORRECT = "correct" as const;
const XP_AWARDED = 10;
const COMPLETED_COUNT_ZERO = 0;
const TEXT_ALL_CHALLENGES_COMPLETE = "All challenges in this lesson are complete!";
const TEXT_NEED_A_HINT = "Need a hint?";
const SELECTOR_HIDDEN_CHALLENGES_FORM = ".workspace-panel__hidden-fields";
const SELECTOR_COMPLETE_PANEL = ".workspace-panel__complete";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

function makeQuizChallenge(overrides: { completed?: boolean; hint?: string } = {}) {
  return {
    id: CHALLENGE_ID_ONE,
    hint: overrides.hint,
    setup: {
      type: "quiz" as const,
      question: QUIZ_QUESTION,
      options: [QUIZ_OPTION_ONE, QUIZ_OPTION_TWO]
    },
    completed: overrides.completed ?? false
  };
}

function makeData(
  overrides: Partial<{
    challenges: ReturnType<typeof makeQuizChallenge>[];
    completedCount: number;
    lastResult: "correct" | "incorrect" | null;
    lastMessage: string | null;
    xpAwarded: number;
  }> = {}
) {
  return {
    chapterId: CHAPTER_ID,
    lessonId: LESSON_ID,
    chapterTitle: CHAPTER_TITLE,
    lessonTitle: LESSON_TITLE,
    lessonDescription: LESSON_DESCRIPTION,
    challenges: overrides.challenges ?? [makeQuizChallenge()],
    completedCount: overrides.completedCount ?? COMPLETED_COUNT_ZERO,
    lastResult: overrides.lastResult ?? null,
    lastMessage: overrides.lastMessage ?? null,
    xpAwarded: overrides.xpAwarded ?? XP_AWARDED,
    user: {
      fingerprint: USER_FINGERPRINT,
      displayName: USER_DISPLAY_NAME,
      publicKey: USER_PUBLIC_KEY
    },
    flash: null
  };
}

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) {
    unmount(component);
  }
});

describe("lesson page — instruction panel", () => {
  it("renders the lesson title", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(LESSON_TITLE);
  });

  it("renders the lesson description", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(LESSON_DESCRIPTION);
  });
});

describe("lesson page — hint", () => {
  it("renders the hint disclosure when a hint is present", () => {
    const dataWithHint = makeData({ challenges: [makeQuizChallenge({ hint: HINT_TEXT })] });
    component = mount(Page, { target: container, props: { data: dataWithHint } });

    expect(container.textContent).toContain(TEXT_NEED_A_HINT);
  });

  it("does not render the hint disclosure when no hint is present", () => {
    const dataNoHint = makeData({ challenges: [makeQuizChallenge()] });
    component = mount(Page, { target: container, props: { data: dataNoHint } });

    expect(container.textContent).not.toContain(TEXT_NEED_A_HINT);
  });
});

describe("lesson page — challenge workspace", () => {
  it("renders a form for the active quiz challenge", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    // The hidden-fields form is always rendered when there is an active challenge
    expect(container.querySelector(SELECTOR_HIDDEN_CHALLENGES_FORM)).not.toBeNull();
  });

  it("renders the all-complete panel when the challenges array is empty", () => {
    // activeChallenge = find(not completed) ?? last — when array is empty both are undefined,
    // so activeChallenge is falsy and the complete panel renders.
    const emptyData = makeData({ challenges: [], completedCount: 0 });
    component = mount(Page, { target: container, props: { data: emptyData } });

    expect(container.querySelector(SELECTOR_COMPLETE_PANEL)).not.toBeNull();
  });

  it("renders the completion text when the challenges array is empty", () => {
    const emptyData = makeData({ challenges: [], completedCount: 0 });
    component = mount(Page, { target: container, props: { data: emptyData } });

    expect(container.textContent).toContain(TEXT_ALL_CHALLENGES_COMPLETE);
  });
});

describe("lesson page — feedback", () => {
  it("does not render a feedback panel when lastResult is null", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.querySelector(".workspace-panel__feedback")).toBeNull();
  });

  it("renders the feedback panel when a result is present", () => {
    const dataWithFeedback = makeData({
      lastResult: RESULT_CORRECT,
      lastMessage: FEEDBACK_MESSAGE
    });
    component = mount(Page, { target: container, props: { data: dataWithFeedback } });

    expect(container.querySelector(".workspace-panel__feedback")).not.toBeNull();
  });
});
