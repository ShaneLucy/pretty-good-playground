import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../../../src/routes/(app)/profile/+page.svelte";

const DISPLAY_NAME = "Alice Coder";
const FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const PUBLIC_KEY = "-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----";
const XP = 1500;
const LEVEL = 3;
const STREAK_DAYS = 7;
const ACHIEVEMENT_ID_ONE = "first_lesson";
const ACHIEVEMENT_ID_TWO = "first_chapter";
const CHAPTER_PROGRESS_ID = "ch1";
const CHAPTER_PROGRESS_TITLE = "Introduction to PGP";
const CHAPTER_PERCENT_COMPLETE = 75;
const HEADING_TEXT = "Your Profile";
const SECTION_DISPLAY_NAME = "Display Name";
const SECTION_VISIBILITY = "Profile Visibility";
const SECTION_CHAPTER_PROGRESS = "Chapter Progress";
const SECTION_ACHIEVEMENTS = "Achievements";
const TEXT_NO_ACHIEVEMENTS = "No achievements yet.";
const TEXT_PROFILE_PUBLIC = "Your profile is public.";
const TEXT_PROFILE_PRIVATE = "Only you can see this page.";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

function makeData(
  overrides: Partial<{
    displayName: string;
    profilePublic: boolean;
    achievements: string[];
    chapterProgresses: { id: string; title: string; percentComplete: number }[];
    xp: number;
    level: number;
    streakDays: number;
  }> = {}
) {
  return {
    displayName: overrides.displayName ?? DISPLAY_NAME,
    profilePublic: overrides.profilePublic ?? false,
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

describe("profile page — heading", () => {
  it("renders the page heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(HEADING_TEXT);
  });
});

describe("profile page — identity section", () => {
  it("renders the display name", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(DISPLAY_NAME);
  });

  it("renders the XP value", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(XP.toLocaleString());
  });

  it("renders the streak days", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(String(STREAK_DAYS));
  });
});

describe("profile page — display name section", () => {
  it("renders the display name section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(SECTION_DISPLAY_NAME);
  });
});

describe("profile page — visibility section", () => {
  it("renders the profile visibility section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(SECTION_VISIBILITY);
  });

  it("shows private visibility note when profilePublic is false", () => {
    component = mount(Page, {
      target: container,
      props: { data: makeData({ profilePublic: false }), form: null }
    });

    expect(container.textContent).toContain(TEXT_PROFILE_PRIVATE);
  });

  it("shows public visibility note when profilePublic is true", () => {
    component = mount(Page, {
      target: container,
      props: { data: makeData({ profilePublic: true }), form: null }
    });

    expect(container.textContent).toContain(TEXT_PROFILE_PUBLIC);
  });
});

describe("profile page — chapter progress section", () => {
  it("renders the chapter progress section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(SECTION_CHAPTER_PROGRESS);
  });

  it("renders the chapter title in the progress list", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(CHAPTER_PROGRESS_TITLE);
  });

  it("renders the percent complete for the chapter", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(`${CHAPTER_PERCENT_COMPLETE}%`);
  });
});

describe("profile page — achievements section", () => {
  it("renders the achievements section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(SECTION_ACHIEVEMENTS);
  });

  it("renders achievement badges when achievements exist", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    const badges = container.querySelectorAll(".achievement-badge");
    expect(badges).toHaveLength(2);
  });

  it("renders the empty state when there are no achievements", () => {
    component = mount(Page, {
      target: container,
      props: { data: makeData({ achievements: [] }), form: null }
    });

    expect(container.textContent).toContain(TEXT_NO_ACHIEVEMENTS);
  });
});
