import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import BottomTabBar from "$lib/components/layout/BottomTabBar.svelte";

const NAV_LABEL = "Mobile navigation";
const DASHBOARD_PATH = "/dashboard";
const PROFILE_PATH = "/profile";
const KEYS_PATH = "/keys";
const ABOUT_PATH = "/about";
const ARIA_CURRENT_PAGE = "page";
const TAB_COUNT = 4;

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

describe("BottomTabBar", () => {
  it("renders a nav element with the correct aria-label", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: DASHBOARD_PATH }
    });

    const nav = container.querySelector(`nav[aria-label="${NAV_LABEL}"]`);

    expect(nav).not.toBeNull();
  });

  it("renders exactly four tab links", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: DASHBOARD_PATH }
    });

    const tabs = container.querySelectorAll("a");

    expect(tabs).toHaveLength(TAB_COUNT);
  });

  it("marks the dashboard tab as current when currentPath is /dashboard", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: DASHBOARD_PATH }
    });

    const currentTab = container.querySelector(`[aria-current="${ARIA_CURRENT_PAGE}"]`);

    expect(currentTab).not.toBeNull();
    expect((currentTab as HTMLAnchorElement).href).toContain(DASHBOARD_PATH);
  });

  it("marks the profile tab as current when currentPath is /profile", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: PROFILE_PATH }
    });

    const currentTab = container.querySelector(`[aria-current="${ARIA_CURRENT_PAGE}"]`);

    expect(currentTab).not.toBeNull();
    expect((currentTab as HTMLAnchorElement).href).toContain(PROFILE_PATH);
  });

  it("marks the keys tab as current when currentPath is /keys", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: KEYS_PATH }
    });

    const currentTab = container.querySelector(`[aria-current="${ARIA_CURRENT_PAGE}"]`);

    expect(currentTab).not.toBeNull();
    expect((currentTab as HTMLAnchorElement).href).toContain(KEYS_PATH);
  });

  it("marks the about tab as current when currentPath is /about", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: ABOUT_PATH }
    });

    const currentTab = container.querySelector(`[aria-current="${ARIA_CURRENT_PAGE}"]`);

    expect(currentTab).not.toBeNull();
    expect((currentTab as HTMLAnchorElement).href).toContain(ABOUT_PATH);
  });

  it("marks no tab as current when currentPath does not match any tab", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: "/unknown" }
    });

    const currentTab = container.querySelector(`[aria-current="${ARIA_CURRENT_PAGE}"]`);

    expect(currentTab).toBeNull();
  });

  it("only marks one tab as current at a time", () => {
    component = mount(BottomTabBar, {
      target: container,
      props: { currentPath: PROFILE_PATH }
    });

    const currentTabs = container.querySelectorAll(`[aria-current="${ARIA_CURRENT_PAGE}"]`);

    expect(currentTabs).toHaveLength(1);
  });
});
