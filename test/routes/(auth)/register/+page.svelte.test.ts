import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import RegisterPage from "../../../../src/routes/(auth)/register/+page.svelte";

const HEADING_TEXT = "Create your account";
const GLOBAL_ERROR_MESSAGE = "A key with this fingerprint is already registered.";
const DISPLAY_NAME_ERROR_MESSAGE = "Display name is required.";
const SIGN_IN_LINK_TEXT = "Sign in";
const DISPLAY_NAME_FIELD = "displayName";
const PUBLIC_KEY_FIELD = "publicKey";
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

describe("register +page.svelte — heading and structure", () => {
  it("renders the Create your account heading", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    const heading = container.querySelector("h1");

    expect(heading).not.toBeNull();
    expect(heading?.textContent?.trim()).toBe(HEADING_TEXT);
  });

  it("renders a form element", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    expect(container.querySelector("form")).not.toBeNull();
  });

  it("renders the display name input", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    const input = container.querySelector(`input[name="${DISPLAY_NAME_FIELD}"]`);

    expect(input).not.toBeNull();
  });

  it("renders the public key textarea", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    const textarea = container.querySelector(`textarea[name="${PUBLIC_KEY_FIELD}"]`);

    expect(textarea).not.toBeNull();
  });

  it("renders the Sign in link", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    const links = Array.from(container.querySelectorAll("a"));
    const signIn = links.find((a) => a.textContent?.trim() === SIGN_IN_LINK_TEXT);

    expect(signIn).not.toBeUndefined();
  });
});

describe("register +page.svelte — global error banner", () => {
  it("does not render the error banner when form is null", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    expect(container.querySelector(".form-error-banner")).toBeNull();
  });

  it("renders the global error banner when form.error is set and field is undefined", () => {
    component = mount(RegisterPage, {
      target: container,
      props: { form: { error: GLOBAL_ERROR_MESSAGE, field: undefined } }
    });

    const banner = container.querySelector(".form-error-banner");

    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("role")).toBe(ROLE_ALERT);
    expect(banner?.textContent?.trim()).toBe(GLOBAL_ERROR_MESSAGE);
  });

  it("does not render the global error banner when field is displayName", () => {
    component = mount(RegisterPage, {
      target: container,
      props: { form: { error: DISPLAY_NAME_ERROR_MESSAGE, field: "displayName" } }
    });

    expect(container.querySelector(".form-error-banner")).toBeNull();
  });

  it("renders no global error banner when form is null", () => {
    component = mount(RegisterPage, { target: container, props: { form: null } });

    expect(container.querySelector(".form-error-banner")).toBeNull();
  });
});
