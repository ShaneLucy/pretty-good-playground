import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import LoginPage from "../../../../src/routes/(auth)/login/+page.svelte";

const HEADING_TEXT = "Sign in";
const ERROR_MESSAGE = "Invalid public key. Please try again.";
const REGISTER_LINK_TEXT = "Create one";
const REMEMBER_DEVICE_TEXT = "Remember this device for 30 days";
const PUBLIC_KEY_NAME = "publicKey";
const REMEMBER_DEVICE_NAME = "rememberDevice";
const ROLE_ALERT = "alert";

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

describe("login +page.svelte — heading and structure", () => {
  it("renders the Sign in heading", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    const heading = container.querySelector("h1");

    expect(heading).not.toBeNull();
    expect(heading?.textContent?.trim()).toBe(HEADING_TEXT);
  });

  it("renders a form element", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    expect(container.querySelector("form")).not.toBeNull();
  });

  it("renders the public key textarea", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    const textarea = container.querySelector(`textarea[name="${PUBLIC_KEY_NAME}"]`);

    expect(textarea).not.toBeNull();
  });

  it("renders the remember device checkbox", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    const checkbox = container.querySelector(
      `input[type="checkbox"][name="${REMEMBER_DEVICE_NAME}"]`
    );

    expect(checkbox).not.toBeNull();
  });

  it("renders remember device label text", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    expect(container.textContent).toContain(REMEMBER_DEVICE_TEXT);
  });

  it("renders the Create one register link", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    const links = Array.from(container.querySelectorAll("a"));
    const registerLink = links.find((a) => a.textContent?.trim() === REGISTER_LINK_TEXT);

    expect(registerLink).not.toBeUndefined();
  });
});

describe("login +page.svelte — error banner", () => {
  it("does not render the error banner when form is null", () => {
    component = mount(LoginPage, { target: container, props: { form: null } });

    expect(container.querySelector(`[role="${ROLE_ALERT}"]`)).toBeNull();
  });

  it("renders the error banner with role=alert when form has an error", () => {
    component = mount(LoginPage, {
      target: container,
      props: { form: { error: ERROR_MESSAGE } }
    });

    const alert = container.querySelector(`[role="${ROLE_ALERT}"]`);

    expect(alert).not.toBeNull();
    expect(alert?.textContent?.trim()).toBe(ERROR_MESSAGE);
  });
});
