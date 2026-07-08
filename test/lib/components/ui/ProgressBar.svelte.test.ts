import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import ProgressBar from "$lib/components/ui/ProgressBar.svelte";

const LABEL_TEXT = "Experience points";
const PROGRESS_VALUE = 30;
const PROGRESS_MAX = 100;
const EXPECTED_PCT = 30;

const VARIANT_XP = "xp";
const VARIANT_LESSON = "lesson";
const VARIANT_CHAPTER = "chapter";

const CLASS_BASE = "progress-bar";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) unmount(component);
});

describe("ProgressBar — rendering", () => {
  it("renders a progress element", () => {
    component = mount(ProgressBar, {
      target: container,
      props: { value: PROGRESS_VALUE, max: PROGRESS_MAX, label: LABEL_TEXT }
    });

    expect(container.querySelector("progress")).not.toBeNull();
  });

  it("sets the value attribute correctly", () => {
    component = mount(ProgressBar, {
      target: container,
      props: { value: PROGRESS_VALUE, max: PROGRESS_MAX, label: LABEL_TEXT }
    });

    const progress = container.querySelector("progress") as HTMLProgressElement;

    expect(progress.value).toBe(PROGRESS_VALUE);
  });

  it("sets the max attribute correctly", () => {
    component = mount(ProgressBar, {
      target: container,
      props: { value: PROGRESS_VALUE, max: PROGRESS_MAX, label: LABEL_TEXT }
    });

    const progress = container.querySelector("progress") as HTMLProgressElement;

    expect(progress.max).toBe(PROGRESS_MAX);
  });

  it("includes the label and percentage in aria-label", () => {
    component = mount(ProgressBar, {
      target: container,
      props: { value: PROGRESS_VALUE, max: PROGRESS_MAX, label: LABEL_TEXT }
    });

    const progress = container.querySelector("progress");
    const ariaLabel = progress?.getAttribute("aria-label") ?? "";

    expect(ariaLabel).toContain(LABEL_TEXT);
    expect(ariaLabel).toContain(`${EXPECTED_PCT}%`);
  });
});

describe("ProgressBar — variant prop", () => {
  it("applies the xp modifier class by default", () => {
    component = mount(ProgressBar, {
      target: container,
      props: { value: PROGRESS_VALUE, max: PROGRESS_MAX, label: LABEL_TEXT }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_XP}`)).not.toBeNull();
  });

  it("applies the lesson modifier class when variant is lesson", () => {
    component = mount(ProgressBar, {
      target: container,
      props: {
        value: PROGRESS_VALUE,
        max: PROGRESS_MAX,
        label: LABEL_TEXT,
        variant: VARIANT_LESSON
      }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_LESSON}`)).not.toBeNull();
  });

  it("applies the chapter modifier class when variant is chapter", () => {
    component = mount(ProgressBar, {
      target: container,
      props: {
        value: PROGRESS_VALUE,
        max: PROGRESS_MAX,
        label: LABEL_TEXT,
        variant: VARIANT_CHAPTER
      }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_CHAPTER}`)).not.toBeNull();
  });
});

describe("ProgressBar — percentage calculation", () => {
  it("rounds the percentage to a whole number in aria-label", () => {
    const VALUE_WITH_FRACTION = 1;
    const MAX_UNEVEN = 3;
    const EXPECTED_ROUNDED_PCT = 33;

    component = mount(ProgressBar, {
      target: container,
      props: { value: VALUE_WITH_FRACTION, max: MAX_UNEVEN, label: LABEL_TEXT }
    });

    const progress = container.querySelector("progress");
    const ariaLabel = progress?.getAttribute("aria-label") ?? "";

    expect(ariaLabel).toContain(`${EXPECTED_ROUNDED_PCT}%`);
  });
});
