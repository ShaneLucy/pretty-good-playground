import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import LessonProgressBar from "$lib/components/tutorial/LessonProgressBar.svelte";

const TOTAL_THREE = 3;
const TOTAL_FOUR = 4;
const TOTAL_FIVE = 5;
const COMPLETED_ONE = 1;
const COMPLETED_TWO = 2;
const CLASS_SEGMENT = ".lesson-progress__segment";
const CLASS_SEGMENT_FILLED = ".lesson-progress__segment--filled";
const SELECTOR_ROLE_IMG = '[role="img"]';
const ATTR_ARIA_LABEL = "aria-label";
const LABEL_COMPLETED_TEXT = "challenges completed";

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

describe("LessonProgressBar — label", () => {
  it("renders the correct label", () => {
    component = mount(LessonProgressBar, {
      target: container,
      props: { total: TOTAL_FIVE, completed: COMPLETED_TWO }
    });

    expect(container.textContent).toContain(`${COMPLETED_TWO}/${TOTAL_FIVE}`);
  });
});

describe("LessonProgressBar — segments", () => {
  it("renders the correct number of segments", () => {
    component = mount(LessonProgressBar, {
      target: container,
      props: { total: TOTAL_THREE, completed: COMPLETED_ONE }
    });

    expect(container.querySelectorAll(CLASS_SEGMENT)).toHaveLength(TOTAL_THREE);
  });

  it("marks completed segments with the filled class", () => {
    component = mount(LessonProgressBar, {
      target: container,
      props: { total: TOTAL_THREE, completed: COMPLETED_TWO }
    });

    expect(container.querySelectorAll(CLASS_SEGMENT_FILLED)).toHaveLength(COMPLETED_TWO);
  });
});

describe("LessonProgressBar — accessibility", () => {
  it("aria-label reflects completed and total", () => {
    component = mount(LessonProgressBar, {
      target: container,
      props: { total: TOTAL_FOUR, completed: COMPLETED_ONE }
    });

    const ariaLabel =
      container.querySelector(SELECTOR_ROLE_IMG)?.getAttribute(ATTR_ARIA_LABEL) ?? "";

    expect(ariaLabel).toContain(`${COMPLETED_ONE} of ${TOTAL_FOUR}`);
    expect(ariaLabel).toContain(LABEL_COMPLETED_TEXT);
  });
});
