import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../../../../src/routes/(app)/learn/[chapterId]/+page.svelte";

const CHAPTER_ID = "ch1";
const CHAPTER_TITLE = "Introduction to PGP";
const CHAPTER_DESCRIPTION = "Learn the fundamentals of PGP encryption.";
const LESSON_ID_ONE = "l1";
const LESSON_ID_TWO = "l2";
const LESSON_TITLE_ONE = "What is PGP?";
const LESSON_TITLE_TWO = "Key Pairs";
const LESSONS_HEADING = "Lessons";
const STATUS_LOCKED = "locked" as const;
const STATUS_IN_PROGRESS = "in-progress" as const;
const STATUS_COMPLETED = "completed" as const;
const CHALLENGE_COUNT = 3;
const COMPLETED_CHALLENGE_COUNT = 0;
const LESSON_DESCRIPTION = "A lesson description.";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

const USER_FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const USER_DISPLAY_NAME = "Test User";
const USER_PUBLIC_KEY = "";

function makeLessonSummary(
  id: string,
  title: string,
  status: "locked" | "in-progress" | "completed"
) {
  return {
    id,
    title,
    description: LESSON_DESCRIPTION,
    challengeCount: CHALLENGE_COUNT,
    completedChallengeCount: COMPLETED_CHALLENGE_COUNT,
    status
  };
}

function makeData(
  overrides: Partial<{ lessonSummaries: ReturnType<typeof makeLessonSummary>[] }> = {}
) {
  return {
    chapter: {
      id: CHAPTER_ID,
      title: CHAPTER_TITLE,
      description: CHAPTER_DESCRIPTION
    },
    lessonSummaries: overrides.lessonSummaries ?? [
      makeLessonSummary(LESSON_ID_ONE, LESSON_TITLE_ONE, STATUS_IN_PROGRESS),
      makeLessonSummary(LESSON_ID_TWO, LESSON_TITLE_TWO, STATUS_LOCKED)
    ],
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

describe("chapter page — header content", () => {
  it("renders the chapter title", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CHAPTER_TITLE);
  });

  it("renders the chapter description", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CHAPTER_DESCRIPTION);
  });
});

describe("chapter page — lessons section", () => {
  it("renders the lessons heading", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(LESSONS_HEADING);
  });

  it("renders one item per lesson summary", () => {
    const twoLessons = makeData();
    component = mount(Page, { target: container, props: { data: twoLessons } });

    const lessonCards = container.querySelectorAll(".lesson-card");
    expect(lessonCards).toHaveLength(2);
  });

  it("renders the first lesson title", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(LESSON_TITLE_ONE);
  });

  it("renders the second lesson title", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(LESSON_TITLE_TWO);
  });
});

describe("chapter page — empty lessons", () => {
  it("renders no lesson cards when lessonSummaries is empty", () => {
    const emptyData = makeData({ lessonSummaries: [] });
    component = mount(Page, { target: container, props: { data: emptyData } });

    const lessonCards = container.querySelectorAll(".lesson-card");
    expect(lessonCards).toHaveLength(0);
  });
});

describe("chapter page — lesson status", () => {
  it("renders a completed lesson card with the completed modifier", () => {
    const dataWithCompleted = makeData({
      lessonSummaries: [makeLessonSummary(LESSON_ID_ONE, LESSON_TITLE_ONE, STATUS_COMPLETED)]
    });
    component = mount(Page, { target: container, props: { data: dataWithCompleted } });

    expect(container.querySelector(".lesson-card--completed")).not.toBeNull();
  });
});
