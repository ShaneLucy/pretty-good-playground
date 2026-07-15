import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import FeedbackPanel from "$lib/components/tutorial/FeedbackPanel.svelte";

const RESULT_CORRECT = "correct" as const;
const RESULT_INCORRECT = "incorrect" as const;
const MESSAGE_CORRECT = "Great job!";
const MESSAGE_INCORRECT = "Try again.";
const XP_AWARDED_NONZERO = 50;
const XP_AWARDED_ZERO = 0;
const NEXT_HREF = "/learn/ch1/l2" as const;
const NEXT_HREF_IGNORED = "/dashboard" as const;
const CLASS_PANEL = ".feedback-panel";
const CLASS_PANEL_XP = ".feedback-panel__xp";
const CLASS_PANEL_NEXT = ".feedback-panel__next";
const CLASS_CORRECT = ".feedback-panel--correct";
const CLASS_INCORRECT = ".feedback-panel--incorrect";
const TEXT_XP_PREFIX = "+";
const TEXT_XP_SUFFIX = " XP";
const SELECTOR_NEXT_LINK = `a[href="${NEXT_HREF}"]`;

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

describe("FeedbackPanel — null result", () => {
  it("renders nothing when result is null", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: { result: null, message: "", xpAwarded: XP_AWARDED_ZERO, nextHref: null }
    });

    expect(container.querySelector(CLASS_PANEL)).toBeNull();
  });
});

describe("FeedbackPanel — message", () => {
  it("renders the message text when result is correct", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_CORRECT,
        message: MESSAGE_CORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: null
      }
    });

    expect(container.textContent).toContain(MESSAGE_CORRECT);
  });

  it("renders the message text when result is incorrect", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_INCORRECT,
        message: MESSAGE_INCORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: null
      }
    });

    expect(container.textContent).toContain(MESSAGE_INCORRECT);
  });
});

describe("FeedbackPanel — XP", () => {
  it("renders XP awarded when correct and xpAwarded > 0", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_CORRECT,
        message: MESSAGE_CORRECT,
        xpAwarded: XP_AWARDED_NONZERO,
        nextHref: null
      }
    });

    expect(container.textContent).toContain(
      `${TEXT_XP_PREFIX}${XP_AWARDED_NONZERO}${TEXT_XP_SUFFIX}`
    );
  });

  it("does not render XP when xpAwarded is 0", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_CORRECT,
        message: MESSAGE_CORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: null
      }
    });

    expect(container.querySelector(CLASS_PANEL_XP)).toBeNull();
  });
});

describe("FeedbackPanel — next link", () => {
  it("renders a Next link when correct and nextHref provided", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_CORRECT,
        message: MESSAGE_CORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: NEXT_HREF
      }
    });

    expect(container.querySelector(SELECTOR_NEXT_LINK)).not.toBeNull();
  });

  it("does not render Next link when incorrect", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_INCORRECT,
        message: MESSAGE_INCORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: NEXT_HREF_IGNORED
      }
    });

    expect(container.querySelector(CLASS_PANEL_NEXT)).toBeNull();
  });
});

describe("FeedbackPanel — modifier classes", () => {
  it("applies correct modifier class", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_CORRECT,
        message: MESSAGE_CORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: null
      }
    });

    expect(container.querySelector(CLASS_CORRECT)).not.toBeNull();
  });

  it("applies incorrect modifier class", () => {
    component = mount(FeedbackPanel, {
      target: container,
      props: {
        result: RESULT_INCORRECT,
        message: MESSAGE_INCORRECT,
        xpAwarded: XP_AWARDED_ZERO,
        nextHref: null
      }
    });

    expect(container.querySelector(CLASS_INCORRECT)).not.toBeNull();
  });
});
