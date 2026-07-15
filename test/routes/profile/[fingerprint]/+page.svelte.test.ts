import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../../../src/routes/profile/[fingerprint]/+page.svelte";

const DISPLAY_NAME = "Alice Coder";
const FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const PUBLIC_KEY = "-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----";
const XP = 1500;
const LEVEL = 3;
const STREAK_DAYS = 7;
const ACHIEVEMENT_ID_ONE = "first_lesson";
const ACHIEVEMENT_ID_TWO = "first_signature";
const CHAPTER_PROGRESS_ID = "ch1";
const CHAPTER_PROGRESS_TITLE = "Introduction to PGP";
const CHAPTER_PERCENT_COMPLETE = 75;
const HEADING_TEXT = DISPLAY_NAME;
const SECTION_CHAPTER_PROGRESS = "Chapter Progress";
const SECTION_ACHIEVEMENTS = "Achievements";
const TEXT_NO_ACHIEVEMENTS = "No achievements earned yet.";
const TEXT_PUBLIC_NOTICE = "This is a public profile.";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

function makeData(
  overrides: Partial<{
    displayName: string;
    fingerprint: string;
    achievements: string[];
    chapterProgresses: { id: string; title: string; percentComplete: number }[];
    xp: number;
    level: number;
    streakDays: number;
  }> = {}
) {
  return {
    displayName: overrides.displayName ?? DISPLAY_NAME,
    fingerprint: overrides.fingerprint ?? FINGERPRINT,
    achievements: overrides.achievements ?? [ACHIEVEMENT_ID_ONE, ACHIEVEMENT_ID_TWO],
    chapterProgresses: overrides.chapterProgresses ?? [
      {
        id: CHAPTER_PROGRESS_ID,
        title: CHAPTER_PROGRESS_TITLE,
        percentComplete: CHAPTER_PERCENT_COMPLETE
      }
    ],
    xp: overrides.xp ?? XP,
    level: overrides.level ?? LEVEL,
    streakDays: overrides.streakDays ?? STREAK_DAYS,
    // Layout data injected by the root +layout.server.ts
    user: {
      fingerprint: FINGERPRINT,
      displayName: DISPLAY_NAME,
      publicKey: PUBLIC_KEY
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

describe("public profile page — heading", () => {
  it("renders the display name as the page heading", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(HEADING_TEXT);
  });
});

describe("public profile page — public notice", () => {
  it("renders the public profile notice", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(TEXT_PUBLIC_NOTICE);
  });
});

describe("public profile page — identity section", () => {
  it("renders the XP value", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(XP.toLocaleString());
  });

  it("renders the streak days", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(String(STREAK_DAYS));
  });

  it("renders the achievement count", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain("2");
  });

  it("renders the fingerprint", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(FINGERPRINT.slice(0, 4).toUpperCase());
  });
});

describe("public profile page — chapter progress section", () => {
  it("renders the chapter progress section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(SECTION_CHAPTER_PROGRESS);
  });

  it("renders the chapter title in the progress list", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(CHAPTER_PROGRESS_TITLE);
  });

  it("renders the percent complete for the chapter", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(`${CHAPTER_PERCENT_COMPLETE}%`);
  });
});

describe("public profile page — achievements section", () => {
  it("renders the achievements section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    expect(container.textContent).toContain(SECTION_ACHIEVEMENTS);
  });

  it("renders achievement badges when achievements exist", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    const badges = container.querySelectorAll(".achievement-badge");
    expect(badges).toHaveLength(2);
  });

  it("renders the empty state when there are no achievements", () => {
    component = mount(Page, {
      target: container,
      props: { data: makeData({ achievements: [] }) }
    });

    expect(container.textContent).toContain(TEXT_NO_ACHIEVEMENTS);
  });
});

describe("public profile page — no edit controls", () => {
  it("does not render any form elements", () => {
    component = mount(Page, { target: container, props: { data: makeData() } });

    const forms = container.querySelectorAll("form");
    expect(forms).toHaveLength(0);
  });
});
