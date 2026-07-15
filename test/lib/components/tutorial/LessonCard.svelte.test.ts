import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import LessonCard from "$lib/components/tutorial/LessonCard.svelte";

const LESSON_TITLE = "Introduction";
const LESSON_CHALLENGE_COUNT = 3;
const LESSON_HREF = "/learn/ch1/l1" as const;
const STATUS_LOCKED = "locked" as const;
const STATUS_IN_PROGRESS = "in-progress" as const;
const STATUS_COMPLETED = "completed" as const;
const ICON_CHECKMARK = "✓";
const ICON_LOCK = "🔒";
const TEXT_CHALLENGES_SUFFIX = "challenges";
const CLASS_LOCKED = ".lesson-card--locked";
const CLASS_COMPLETED = ".lesson-card--completed";
const SELECTOR_LINK = `a[href="${LESSON_HREF}"]`;

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) {
    unmount(component);
  }
});

describe("LessonCard — content", () => {
  it("renders the lesson title", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_IN_PROGRESS,
        href: LESSON_HREF
      }
    });

    expect(container.textContent).toContain(LESSON_TITLE);
  });

  it("renders challenge count", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_IN_PROGRESS,
        href: LESSON_HREF
      }
    });

    expect(container.textContent).toContain(`${LESSON_CHALLENGE_COUNT} ${TEXT_CHALLENGES_SUFFIX}`);
  });
});

describe("LessonCard — link", () => {
  it("renders a link when not locked", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_IN_PROGRESS,
        href: LESSON_HREF
      }
    });

    expect(container.querySelector(SELECTOR_LINK)).not.toBeNull();
  });

  it("does not render a link when locked", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_LOCKED,
        href: LESSON_HREF
      }
    });

    expect(container.querySelector("a")).toBeNull();
  });
});

describe("LessonCard — icons", () => {
  it("shows completed icon when completed", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_COMPLETED,
        href: LESSON_HREF
      }
    });

    expect(container.textContent).toContain(ICON_CHECKMARK);
  });

  it("shows locked icon when locked", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_LOCKED,
        href: LESSON_HREF
      }
    });

    expect(container.textContent).toContain(ICON_LOCK);
  });
});

describe("LessonCard — modifier classes", () => {
  it("applies locked modifier class", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_LOCKED,
        href: LESSON_HREF
      }
    });

    expect(container.querySelector(CLASS_LOCKED)).not.toBeNull();
  });

  it("applies completed modifier class", () => {
    component = mount(LessonCard, {
      target: container,
      props: {
        lesson: { title: LESSON_TITLE, challengeCount: LESSON_CHALLENGE_COUNT },
        status: STATUS_COMPLETED,
        href: LESSON_HREF
      }
    });

    expect(container.querySelector(CLASS_COMPLETED)).not.toBeNull();
  });
});
