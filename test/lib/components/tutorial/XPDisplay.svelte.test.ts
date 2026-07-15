import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import XPDisplay from "$lib/components/tutorial/XPDisplay.svelte";

const XP_TOTAL = 1000;
const LEVEL_NUMBER = 4;
const XP_TO_NEXT_LEVEL = 800;
const XP_IN_CURRENT_LEVEL = 200;
const XP_TO_NEXT_LEVEL_ZERO = 0;
const XP_IN_CURRENT_LEVEL_ZERO = 0;
// xp.toLocaleString() for 1000 in "en" locale produces "1,000"
const XP_TOTAL_FORMATTED = "1,000";
const TEXT_PERCENT_FULL = "100%";
const TEXT_PROGRESS_LABEL = `${XP_IN_CURRENT_LEVEL} / ${XP_TO_NEXT_LEVEL} XP`;
const ARIA_LABEL_LEVEL_PREFIX = "Level";
const ATTR_ARIA_LABEL = "aria-label";

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

describe("XPDisplay — XP total", () => {
  it("renders the XP total", () => {
    component = mount(XPDisplay, {
      target: container,
      props: {
        xp: XP_TOTAL,
        level: LEVEL_NUMBER,
        xpToNextLevel: XP_TO_NEXT_LEVEL,
        xpInCurrentLevel: XP_IN_CURRENT_LEVEL_ZERO
      }
    });

    expect(container.textContent).toContain(XP_TOTAL_FORMATTED);
  });
});

describe("XPDisplay — progress label", () => {
  it("renders the progress label", () => {
    component = mount(XPDisplay, {
      target: container,
      props: {
        xp: XP_TOTAL,
        level: LEVEL_NUMBER,
        xpToNextLevel: XP_TO_NEXT_LEVEL,
        xpInCurrentLevel: XP_IN_CURRENT_LEVEL
      }
    });

    expect(container.textContent).toContain(TEXT_PROGRESS_LABEL);
  });

  it("shows 100% when xpToNextLevel is 0", () => {
    component = mount(XPDisplay, {
      target: container,
      props: {
        xp: XP_TOTAL,
        level: LEVEL_NUMBER,
        xpToNextLevel: XP_TO_NEXT_LEVEL_ZERO,
        xpInCurrentLevel: XP_IN_CURRENT_LEVEL_ZERO
      }
    });

    expect(container.textContent).toContain(TEXT_PERCENT_FULL);
  });
});

describe("XPDisplay — accessibility", () => {
  it("has aria-label with level", () => {
    component = mount(XPDisplay, {
      target: container,
      props: {
        xp: XP_TOTAL,
        level: LEVEL_NUMBER,
        xpToNextLevel: XP_TO_NEXT_LEVEL,
        xpInCurrentLevel: XP_IN_CURRENT_LEVEL_ZERO
      }
    });

    const ariaLabel =
      container.querySelector(`[${ATTR_ARIA_LABEL}]`)?.getAttribute(ATTR_ARIA_LABEL) ?? "";

    expect(ariaLabel).toContain(`${ARIA_LABEL_LEVEL_PREFIX} ${LEVEL_NUMBER}`);
  });
});
