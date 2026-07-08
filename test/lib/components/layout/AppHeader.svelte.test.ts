import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import AppHeader from "$lib/components/layout/AppHeader.svelte";

const LOGO_LABEL = "Pretty Good Playground — home";
const MAIN_NAV_LABEL = "Main navigation";
const GET_STARTED_TEXT = "Get Started →";
const SIGN_OUT_TEXT = "Sign Out";
const DASHBOARD_TEXT = "Dashboard";
const USER_DISPLAY_NAME = "Alice";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) unmount(component);
});

describe("AppHeader — unauthenticated variant", () => {
  it("renders the logo link", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "unauthenticated" }
    });

    const logo = container.querySelector(`[aria-label="${LOGO_LABEL}"]`);

    expect(logo).not.toBeNull();
  });

  it("renders the main navigation", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "unauthenticated" }
    });

    const nav = container.querySelector(`nav[aria-label="${MAIN_NAV_LABEL}"]`);

    expect(nav).not.toBeNull();
  });

  it("renders a Get Started link", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "unauthenticated" }
    });

    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent?.trim() === GET_STARTED_TEXT
    );

    expect(link).not.toBeNull();
  });

  it("does not render Sign Out", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "unauthenticated" }
    });

    const links = Array.from(container.querySelectorAll("a"));
    const signOut = links.find((a) => a.textContent?.includes(SIGN_OUT_TEXT));

    expect(signOut).toBeUndefined();
  });
});

describe("AppHeader — authenticated variant", () => {
  it("renders the dashboard link", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "authenticated", user: null }
    });

    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent?.trim() === DASHBOARD_TEXT
    );

    expect(link).not.toBeNull();
  });

  it("renders Sign Out link", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "authenticated", user: null }
    });

    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent?.trim() === SIGN_OUT_TEXT
    );

    expect(link).not.toBeNull();
  });

  it("renders the user display name when user is provided", () => {
    component = mount(AppHeader, {
      target: container,
      props: {
        variant: "authenticated",
        user: { displayName: USER_DISPLAY_NAME, fingerprint: "abc123" }
      }
    });

    expect(container.textContent).toContain(USER_DISPLAY_NAME);
  });

  it("does not render Get Started link", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "authenticated", user: null }
    });

    const links = Array.from(container.querySelectorAll("a"));
    const getStarted = links.find((a) => a.textContent?.includes(GET_STARTED_TEXT));

    expect(getStarted).toBeUndefined();
  });
});

describe("AppHeader — minimal variant", () => {
  it("renders the logo", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "minimal" }
    });

    const logo = container.querySelector(`[aria-label="${LOGO_LABEL}"]`);

    expect(logo).not.toBeNull();
  });

  it("does not render a main navigation", () => {
    component = mount(AppHeader, {
      target: container,
      props: { variant: "minimal" }
    });

    const nav = container.querySelector(`nav[aria-label="${MAIN_NAV_LABEL}"]`);

    expect(nav).toBeNull();
  });
});
