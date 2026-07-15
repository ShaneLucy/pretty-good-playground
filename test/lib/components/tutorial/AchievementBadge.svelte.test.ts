import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import AchievementBadge from "$lib/components/tutorial/AchievementBadge.svelte";

const BADGE_NAME = "First Signature";
const BADGE_DESCRIPTION_EARNED = "You signed!";
const BADGE_DESCRIPTION_HIDDEN = "hidden";
const EARNED_AT_ISO = "2025-01-15T00:00:00Z";
const VARIANT_EARNED = "earned" as const;
const VARIANT_LOCKED = "locked" as const;
const ICON_TROPHY = "🏆";
const ICON_LOCK = "🔒";
const LABEL_NOT_YET_EARNED = "Not yet earned";
const CLASS_DESCRIPTION = ".achievement-badge__description";
const CLASS_EARNED = ".achievement-badge--earned";
const CLASS_LOCKED = ".achievement-badge--locked";
const SELECTOR_TIME = "time";

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

describe("AchievementBadge — name", () => {
  it("renders the achievement name", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: { name: BADGE_NAME, variant: VARIANT_EARNED, earnedAt: null, description: "" }
    });

    expect(container.textContent).toContain(BADGE_NAME);
  });
});

describe("AchievementBadge — description", () => {
  it("renders description when earned", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: {
        name: BADGE_NAME,
        variant: VARIANT_EARNED,
        earnedAt: null,
        description: BADGE_DESCRIPTION_EARNED
      }
    });

    expect(container.textContent).toContain(BADGE_DESCRIPTION_EARNED);
  });

  it("does not render description when locked", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: {
        name: BADGE_NAME,
        variant: VARIANT_LOCKED,
        earnedAt: null,
        description: BADGE_DESCRIPTION_HIDDEN
      }
    });

    expect(container.querySelector(CLASS_DESCRIPTION)).toBeNull();
  });
});

describe("AchievementBadge — icons", () => {
  it("renders trophy icon when earned", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: { name: BADGE_NAME, variant: VARIANT_EARNED, earnedAt: null, description: "" }
    });

    expect(container.textContent).toContain(ICON_TROPHY);
  });

  it("renders lock icon when locked", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: { name: BADGE_NAME, variant: VARIANT_LOCKED, earnedAt: null, description: "" }
    });

    expect(container.textContent).toContain(ICON_LOCK);
  });
});

describe("AchievementBadge — date", () => {
  it("renders formatted date when earnedAt is a valid ISO string", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: {
        name: BADGE_NAME,
        variant: VARIANT_EARNED,
        earnedAt: EARNED_AT_ISO,
        description: ""
      }
    });

    expect(container.querySelector(SELECTOR_TIME)).not.toBeNull();
  });

  it("renders 'Not yet earned' label when locked and no date", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: { name: BADGE_NAME, variant: VARIANT_LOCKED, earnedAt: null, description: "" }
    });

    expect(container.textContent).toContain(LABEL_NOT_YET_EARNED);
  });
});

describe("AchievementBadge — modifier classes", () => {
  it("applies the earned modifier class", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: { name: BADGE_NAME, variant: VARIANT_EARNED, earnedAt: null, description: "" }
    });

    expect(container.querySelector(CLASS_EARNED)).not.toBeNull();
  });

  it("applies the locked modifier class", () => {
    component = mount(AchievementBadge, {
      target: container,
      props: { name: BADGE_NAME, variant: VARIANT_LOCKED, earnedAt: null, description: "" }
    });

    expect(container.querySelector(CLASS_LOCKED)).not.toBeNull();
  });
});
