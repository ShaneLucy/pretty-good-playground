import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../../../src/routes/(app)/dashboard/+page.svelte";

const HEADING_TEXT = "Your Learning Journey";
const UNLOCK_HINT_TEXT = "Chapters unlock as you complete the previous one.";
const STATS_SUMMARY_TEXT = "Your Progress";
const CONTINUE_LABEL_TEXT = "Continue where you left off";
const CHAPTER_ID_ONE = "ch1";
const CHAPTER_TITLE_ONE = "Introduction to PGP";
const CHAPTER_DESCRIPTION_ONE = "Learn the fundamentals of PGP.";
const CHAPTER_ID_TWO = "ch2";
const CHAPTER_TITLE_TWO = "Key Management";
const CHAPTER_DESCRIPTION_TWO = "Manage your PGP keys.";
const CONTINUE_CHAPTER_ID = "ch1";
const CONTINUE_LESSON_ID = "l1";
const CONTINUE_LESSON_TITLE = "What is PGP?";
const CONTINUE_CHAPTER_TITLE = "Introduction to PGP";
const STATUS_IN_PROGRESS = "in-progress" as const;
const STATUS_LOCKED = "locked" as const;
const LESSON_COUNT = 3;
const PERCENT_COMPLETE_ZERO = 0;
const PERCENT_COMPLETE_PARTIAL = 50;
const XP = 0;
const LEVEL = 1;
const LEVEL_TITLE = "Novice";
const XP_TO_NEXT_LEVEL = 500;
const XP_IN_CURRENT_LEVEL = 0;
const STREAK_DAYS = 0;
const ACHIEVEMENT_COUNT = 0;
const FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const PUBLIC_KEY = "-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

function makeStats(
  overrides: Partial<{
    level: number;
    levelTitle: string;
    xp: number;
    xpToNextLevel: number;
    xpInCurrentLevel: number;
    streakDays: number;
    achievementCount: number;
  }> = {}
) {
  return {
    level: overrides.level ?? LEVEL,
    levelTitle: overrides.levelTitle ?? LEVEL_TITLE,
    xp: overrides.xp ?? XP,
    xpToNextLevel: overrides.xpToNextLevel ?? XP_TO_NEXT_LEVEL,
    xpInCurrentLevel: overrides.xpInCurrentLevel ?? XP_IN_CURRENT_LEVEL,
    streakDays: overrides.streakDays ?? STREAK_DAYS,
    achievementCount: overrides.achievementCount ?? ACHIEVEMENT_COUNT
  };
}

function makeUser() {
  return {
    fingerprint: FINGERPRINT,
    displayName: "Test User",
    publicKey: PUBLIC_KEY
  };
}

function makeChapterSummary(
  id: string,
  title: string,
  description: string,
  status: "locked" | "in-progress" | "completed" = STATUS_IN_PROGRESS,
  percentComplete: number = PERCENT_COMPLETE_ZERO
) {
  return {
    id,
    title,
    description,
    lessonCount: LESSON_COUNT,
    percentComplete,
    status
  };
}

function makeData(
  overrides: Partial<{
    continueLesson: {
      chapterId: string;
      lessonId: string;
      title: string;
      chapterTitle: string;
    } | null;
    chapterSummaries: ReturnType<typeof makeChapterSummary>[];
  }> = {}
) {
  return {
    chapterSummaries: overrides.chapterSummaries ?? [
      makeChapterSummary(
        CHAPTER_ID_ONE,
        CHAPTER_TITLE_ONE,
        CHAPTER_DESCRIPTION_ONE,
        STATUS_IN_PROGRESS,
        PERCENT_COMPLETE_PARTIAL
      ),
      makeChapterSummary(CHAPTER_ID_TWO, CHAPTER_TITLE_TWO, CHAPTER_DESCRIPTION_TWO, STATUS_LOCKED)
    ],
    continueLesson:
      overrides.continueLesson !== undefined
        ? overrides.continueLesson
        : {
            chapterId: CONTINUE_CHAPTER_ID,
            lessonId: CONTINUE_LESSON_ID,
            title: CONTINUE_LESSON_TITLE,
            chapterTitle: CONTINUE_CHAPTER_TITLE
          },
    stats: makeStats(),
    user: makeUser(),
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

describe("dashboard page — heading", () => {
  it("renders the main heading", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(HEADING_TEXT);
  });
});

describe("dashboard page — stats sidebar", () => {
  it("renders the stats summary label", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(STATS_SUMMARY_TEXT);
  });

  it("renders the streak days value", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(String(STREAK_DAYS));
  });
});

describe("dashboard page — chapter list", () => {
  it("renders a chapter card for each chapter summary", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    const chapterCards = container.querySelectorAll(".chapter-card");
    expect(chapterCards).toHaveLength(2);
  });

  it("renders the first chapter title", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CHAPTER_TITLE_ONE);
  });

  it("renders the second chapter title", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CHAPTER_TITLE_TWO);
  });

  it("renders the unlock hint", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(UNLOCK_HINT_TEXT);
  });
});

describe("dashboard page — continue banner", () => {
  it("renders the continue banner when continueLesson is set", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.querySelector(".dashboard__continue")).not.toBeNull();
  });

  it("renders the continue label when continueLesson is set", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CONTINUE_LABEL_TEXT);
  });

  it("renders the continue lesson title inside the banner", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CONTINUE_LESSON_TITLE);
  });

  it("does not render the continue banner when continueLesson is null", () => {
    const dataWithoutContinue = makeData({ continueLesson: null });
    component = mount(Page, { target: container, props: { data: dataWithoutContinue } });

    expect(container.querySelector(".dashboard__continue")).toBeNull();
  });
});

describe("dashboard page — empty chapter list", () => {
  it("renders no chapter cards when chapterSummaries is empty", () => {
    const emptyData = makeData({ chapterSummaries: [] });
    component = mount(Page, { target: container, props: { data: emptyData } });

    const chapterCards = container.querySelectorAll(".chapter-card");
    expect(chapterCards).toHaveLength(0);
  });
});
