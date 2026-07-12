import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Layout from "../../src/routes/+layout.svelte";

const SKIP_LINK_TEXT = "Skip to main content";
const SKIP_LINK_HREF = "#main-content";
const MAIN_ID = "main-content";
const CHILD_CONTENT = "child content";
const CHILD_HTML = `<span>${CHILD_CONTENT}</span>`;
const GET_STARTED_TEXT = "Get Started →";
const DASHBOARD_TEXT = "Dashboard";

const NULL_FLASH = null;
const NULL_USER = null;
const MOCK_USER = {
  fingerprint: "abc123fingerprint",
  displayName: "Alice",
  publicKey: "-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----"
};

const children = createRawSnippet(() => ({
  render: () => CHILD_HTML,
  setup: () => {}
}));

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

describe("+layout.svelte", () => {
  it("renders the skip link", () => {
    component = mount(Layout, {
      target: container,
      props: { data: { user: NULL_USER, flash: NULL_FLASH }, children }
    });

    const skipLink = container.querySelector(`a[href="${SKIP_LINK_HREF}"]`);

    expect(skipLink).not.toBeNull();
    expect(skipLink?.textContent?.trim()).toBe(SKIP_LINK_TEXT);
  });

  it("renders a main element with the correct id", () => {
    component = mount(Layout, {
      target: container,
      props: { data: { user: NULL_USER, flash: NULL_FLASH }, children }
    });

    const main = container.querySelector(`main#${MAIN_ID}`);

    expect(main).not.toBeNull();
  });

  it("renders a footer element", () => {
    component = mount(Layout, {
      target: container,
      props: { data: { user: NULL_USER, flash: NULL_FLASH }, children }
    });

    expect(container.querySelector("footer")).not.toBeNull();
  });

  it("renders the unauthenticated header when user is null", () => {
    component = mount(Layout, {
      target: container,
      props: { data: { user: NULL_USER, flash: NULL_FLASH }, children }
    });

    const links = Array.from(container.querySelectorAll("a"));
    const getStarted = links.find((a) => a.textContent?.trim() === GET_STARTED_TEXT);

    expect(getStarted).not.toBeUndefined();
  });

  it("renders the authenticated header when user is set", () => {
    component = mount(Layout, {
      target: container,
      props: { data: { user: MOCK_USER, flash: NULL_FLASH }, children }
    });

    const links = Array.from(container.querySelectorAll("a"));
    const dashboard = links.find((a) => a.textContent?.trim() === DASHBOARD_TEXT);

    expect(dashboard).not.toBeUndefined();
  });

  it("renders children content inside main", () => {
    component = mount(Layout, {
      target: container,
      props: { data: { user: NULL_USER, flash: NULL_FLASH }, children }
    });

    const main = container.querySelector(`main#${MAIN_ID}`);

    expect(main?.textContent).toContain(CHILD_CONTENT);
  });
});
