import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../src/routes/+page.svelte";

const HEADING_TEXT = "Welcome to PGP Playground";
const GET_STARTED_TEXT = "Get Started";
const SIGN_IN_TEXT = "Sign In";

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

describe("+page.svelte — home page", () => {
  it("renders the main heading", () => {
    component = mount(Page, { target: container, props: {} });

    const heading = container.querySelector("h1");

    expect(heading).not.toBeNull();
    expect(heading?.textContent?.trim()).toBe(HEADING_TEXT);
  });

  it("renders a Get Started link", () => {
    component = mount(Page, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const getStarted = links.find((a) => a.textContent?.trim() === GET_STARTED_TEXT);

    expect(getStarted).not.toBeUndefined();
  });

  it("renders a Sign In link", () => {
    component = mount(Page, { target: container, props: {} });

    const links = Array.from(container.querySelectorAll("a"));
    const signIn = links.find((a) => a.textContent?.trim() === SIGN_IN_TEXT);

    expect(signIn).not.toBeUndefined();
  });
});
