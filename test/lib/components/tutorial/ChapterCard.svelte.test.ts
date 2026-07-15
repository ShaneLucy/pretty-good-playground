import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import ChapterCard from "$lib/components/tutorial/ChapterCard.svelte";

const CHAPTER_TITLE = "Key Management";
const CHAPTER_DESCRIPTION = "Learn about keys";
const CHAPTER_LESSON_COUNT = 3;
const CHAPTER_LESSON_COUNT_ALT = 4;
const PERCENT_COMPLETE = 50;
const CHAPTER_HREF = "/learn/ch1" as const;
const STATUS_LOCKED = "locked" as const;
const STATUS_IN_PROGRESS = "in-progress" as const;
const STATUS_COMPLETED = "completed" as const;
const ICON_CHECKMARK = "✓";
const ICON_LOCK = "🔒";
const TEXT_LESSONS_SUFFIX = "lessons";
const TEXT_PERCENT_SUFFIX = "%";
const CLASS_LOCKED = ".chapter-card--locked";
const CLASS_COMPLETED = ".chapter-card--completed";
const CLASS_TITLE_LINK = ".chapter-card__title-link";
const SELECTOR_LINK = "a";

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

describe("ChapterCard — content", () => {
  it("renders the chapter title", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_IN_PROGRESS,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.textContent).toContain(CHAPTER_TITLE);
  });

  it("renders lesson count", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_IN_PROGRESS,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.textContent).toContain(`${CHAPTER_LESSON_COUNT} ${TEXT_LESSONS_SUFFIX}`);
  });

  it("renders percent complete", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT_ALT
        },
        status: STATUS_IN_PROGRESS,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.textContent).toContain(`${PERCENT_COMPLETE}${TEXT_PERCENT_SUFFIX}`);
  });
});

describe("ChapterCard — link", () => {
  it("renders a link when not locked", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_IN_PROGRESS,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.querySelector(SELECTOR_LINK)).not.toBeNull();
  });

  it("does not render a link when locked", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_LOCKED,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.querySelector(CLASS_TITLE_LINK)).toBeNull();
  });
});

describe("ChapterCard — modifier classes", () => {
  it("applies locked modifier class", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_LOCKED,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.querySelector(CLASS_LOCKED)).not.toBeNull();
  });

  it("applies completed modifier class", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_COMPLETED,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.querySelector(CLASS_COMPLETED)).not.toBeNull();
  });
});

describe("ChapterCard — icons", () => {
  it("shows completed icon when status is completed", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_COMPLETED,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.textContent).toContain(ICON_CHECKMARK);
  });

  it("shows locked icon when locked", () => {
    component = mount(ChapterCard, {
      target: container,
      props: {
        chapter: {
          title: CHAPTER_TITLE,
          description: CHAPTER_DESCRIPTION,
          lessonCount: CHAPTER_LESSON_COUNT
        },
        status: STATUS_LOCKED,
        percentComplete: PERCENT_COMPLETE,
        href: CHAPTER_HREF
      }
    });

    expect(container.textContent).toContain(ICON_LOCK);
  });
});
