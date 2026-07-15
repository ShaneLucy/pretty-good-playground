import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import LevelBadge from "$lib/components/tutorial/LevelBadge.svelte";

const LEVEL_NUMBER = 5;
const LEVEL_TITLE = "Encryptor";
const VARIANT_COMPACT = "compact" as const;
const VARIANT_LARGE = "large" as const;
const CLASS_COMPACT = ".level-badge--compact";
const CLASS_LARGE = ".level-badge--large";
const ARIA_LABEL_PREFIX = "Level";
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

describe("LevelBadge — content", () => {
  it("renders level number", () => {
    component = mount(LevelBadge, {
      target: container,
      props: { level: LEVEL_NUMBER, title: LEVEL_TITLE }
    });

    expect(container.textContent).toContain(String(LEVEL_NUMBER));
  });

  it("renders level title", () => {
    component = mount(LevelBadge, {
      target: container,
      props: { level: LEVEL_NUMBER, title: LEVEL_TITLE }
    });

    expect(container.textContent).toContain(LEVEL_TITLE);
  });
});

describe("LevelBadge — variant classes", () => {
  it("applies compact class by default", () => {
    component = mount(LevelBadge, {
      target: container,
      props: { level: LEVEL_NUMBER, title: LEVEL_TITLE }
    });

    expect(container.querySelector(CLASS_COMPACT)).not.toBeNull();
  });

  it("applies large class for large variant", () => {
    component = mount(LevelBadge, {
      target: container,
      props: { level: LEVEL_NUMBER, title: LEVEL_TITLE, variant: VARIANT_LARGE }
    });

    expect(container.querySelector(CLASS_LARGE)).not.toBeNull();
  });
});

describe("LevelBadge — accessibility", () => {
  it("has aria-label with level and title", () => {
    component = mount(LevelBadge, {
      target: container,
      props: { level: LEVEL_NUMBER, title: LEVEL_TITLE, variant: VARIANT_COMPACT }
    });

    const ariaLabel =
      container.querySelector(`[${ATTR_ARIA_LABEL}]`)?.getAttribute(ATTR_ARIA_LABEL) ?? "";

    expect(ariaLabel).toContain(`${ARIA_LABEL_PREFIX} ${LEVEL_NUMBER}`);
  });
});
