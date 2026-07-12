import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Footer from "$lib/components/layout/Footer.svelte";

const FOOTER_NAV_LABEL = "Footer navigation";
const BRAND_LINK_TEXT = "PGP Playground";
const ABOUT_LINK_TEXT = "About";
const GITHUB_LINK_TEXT = "GitHub";
const RESOURCES_LINK_TEXT = "Resources";
const LOST_KEY_LINK_TEXT = "Lost your key?";

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

describe("Footer", () => {
  it("renders a footer element", () => {
    component = mount(Footer, { target: container, props: {} });

    expect(container.querySelector("footer")).not.toBeNull();
  });

  it("renders the site brand link", () => {
    component = mount(Footer, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const brand = links.find((a) => a.textContent?.trim() === BRAND_LINK_TEXT);

    expect(brand).not.toBeNull();
  });

  it("renders a footer nav with the correct aria-label", () => {
    component = mount(Footer, { target: container, props: {} });

    const nav = container.querySelector(`nav[aria-label="${FOOTER_NAV_LABEL}"]`);

    expect(nav).not.toBeNull();
  });

  it("renders an About link", () => {
    component = mount(Footer, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const about = links.find((a) => a.textContent?.trim() === ABOUT_LINK_TEXT);

    expect(about).not.toBeNull();
  });

  it("renders a GitHub link", () => {
    component = mount(Footer, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const github = links.find((a) => a.textContent?.includes(GITHUB_LINK_TEXT));

    expect(github).not.toBeNull();
  });

  it("renders a Resources link", () => {
    component = mount(Footer, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const resources = links.find((a) => a.textContent?.trim() === RESOURCES_LINK_TEXT);

    expect(resources).not.toBeNull();
  });

  it("renders a Lost your key link", () => {
    component = mount(Footer, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const lostKey = links.find((a) => a.textContent?.includes(LOST_KEY_LINK_TEXT));

    expect(lostKey).not.toBeNull();
  });
});
