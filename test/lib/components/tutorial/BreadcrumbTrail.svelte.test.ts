import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import BreadcrumbTrail from "$lib/components/tutorial/BreadcrumbTrail.svelte";

const CRUMB_HOME_LABEL = "Home";
const CRUMB_HOME_HREF = "/" as const;
const CRUMB_CHAPTER_LABEL = "Chapter 1";
const CRUMB_ONLY_LABEL = "Only";
const SELECTOR_HOME_LINK = `a[href="${CRUMB_HOME_HREF}"]`;
const ATTR_ARIA_CURRENT = "aria-current";
const ARIA_CURRENT_PAGE = "page";
const CLASS_SEPARATOR = ".breadcrumb__separator";

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

describe("BreadcrumbTrail — crumb labels", () => {
  it("renders all crumb labels", () => {
    component = mount(BreadcrumbTrail, {
      target: container,
      props: {
        crumbs: [
          { label: CRUMB_HOME_LABEL, href: CRUMB_HOME_HREF },
          { label: CRUMB_CHAPTER_LABEL, href: null }
        ]
      }
    });

    expect(container.textContent).toContain(CRUMB_HOME_LABEL);
    expect(container.textContent).toContain(CRUMB_CHAPTER_LABEL);
  });
});

describe("BreadcrumbTrail — links", () => {
  it("renders a link for non-last crumbs with href", () => {
    component = mount(BreadcrumbTrail, {
      target: container,
      props: {
        crumbs: [
          { label: CRUMB_HOME_LABEL, href: CRUMB_HOME_HREF },
          { label: CRUMB_CHAPTER_LABEL, href: null }
        ]
      }
    });

    expect(container.querySelector(SELECTOR_HOME_LINK)).not.toBeNull();
  });

  it("renders a span for the last crumb", () => {
    component = mount(BreadcrumbTrail, {
      target: container,
      props: {
        crumbs: [
          { label: CRUMB_HOME_LABEL, href: CRUMB_HOME_HREF },
          { label: CRUMB_CHAPTER_LABEL, href: null }
        ]
      }
    });

    const current = container.querySelector(`[${ATTR_ARIA_CURRENT}="${ARIA_CURRENT_PAGE}"]`);

    expect(current).not.toBeNull();
  });

  it("renders a span for crumbs with null href", () => {
    component = mount(BreadcrumbTrail, {
      target: container,
      props: { crumbs: [{ label: CRUMB_ONLY_LABEL, href: null }] }
    });

    expect(container.querySelector("a")).toBeNull();
  });
});

describe("BreadcrumbTrail — separators", () => {
  it("renders separator icons between crumbs", () => {
    component = mount(BreadcrumbTrail, {
      target: container,
      props: {
        crumbs: [
          { label: CRUMB_HOME_LABEL, href: CRUMB_HOME_HREF },
          { label: CRUMB_CHAPTER_LABEL, href: null }
        ]
      }
    });

    expect(container.querySelector(CLASS_SEPARATOR)).not.toBeNull();
  });
});
