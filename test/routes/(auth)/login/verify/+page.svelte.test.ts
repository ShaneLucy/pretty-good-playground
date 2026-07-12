import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import VerifyPage from "../../../../../src/routes/(auth)/login/verify/+page.svelte";

const HEADING_TEXT = "Sign the challenge";
const STEP_TEXT = "Step 2 of 2";
const NONCE_VALUE = "abc123nonce456def";
const ERROR_MESSAGE = "Invalid signature. Please try again.";
const START_OVER_TEXT = "Start over";
const SIGNATURE_NAME = "signature";
const ROLE_ALERT = "alert";

const NULL_USER = null;
const NULL_FLASH = null;

const PAGE_DATA = { nonce: NONCE_VALUE, user: NULL_USER, flash: NULL_FLASH };

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

describe("verify +page.svelte — heading and structure", () => {
  it("renders the Sign the challenge heading", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    const heading = container.querySelector("h1");

    expect(heading).not.toBeNull();
    expect(heading?.textContent?.trim()).toBe(HEADING_TEXT);
  });

  it("renders the Step 2 of 2 progress indicator", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    expect(container.textContent).toContain(STEP_TEXT);
  });

  it("renders the nonce text in the page", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    expect(container.textContent).toContain(NONCE_VALUE);
  });

  it("renders a form element", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    expect(container.querySelector("form")).not.toBeNull();
  });

  it("renders the signature textarea", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    const textarea = container.querySelector(`textarea[name="${SIGNATURE_NAME}"]`);

    expect(textarea).not.toBeNull();
  });

  it("renders the Start over link", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    const links = Array.from(container.querySelectorAll("a"));
    const startOver = links.find((a) => a.textContent?.trim() === START_OVER_TEXT);

    expect(startOver).not.toBeUndefined();
  });
});

describe("verify +page.svelte — error banner", () => {
  it("does not render the error banner when form is null", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: null }
    });

    expect(container.querySelector(`[role="${ROLE_ALERT}"]`)).toBeNull();
  });

  it("renders the error banner with role=alert when form has an error", () => {
    component = mount(VerifyPage, {
      target: container,
      props: { data: PAGE_DATA, form: { error: ERROR_MESSAGE } }
    });

    const alert = container.querySelector(`[role="${ROLE_ALERT}"]`);

    expect(alert).not.toBeNull();
    expect(alert?.textContent?.trim()).toBe(ERROR_MESSAGE);
  });
});
