import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import SignWorkspace from "$lib/components/workspaces/SignWorkspace.svelte";

const PLAINTEXT = "Sign this message";
const SELECTOR_TEXTAREA = 'textarea[name="signature"]';
const SELECTOR_SUBMIT = 'button[type="submit"]';
const SELECTOR_FORM_POST = 'form[method="POST"]';

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

beforeEach(() => {
  container.innerHTML = "";
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    writable: true,
    configurable: true
  });
});

afterEach(() => {
  if (component) {
    unmount(component);
  }
});

describe("SignWorkspace — plaintext", () => {
  it("renders the plaintext to sign", () => {
    component = mount(SignWorkspace, {
      target: container,
      props: { plaintext: PLAINTEXT }
    });

    expect(container.textContent).toContain(PLAINTEXT);
  });
});

describe("SignWorkspace — form elements", () => {
  it("renders a signature textarea", () => {
    component = mount(SignWorkspace, {
      target: container,
      props: { plaintext: PLAINTEXT }
    });

    expect(container.querySelector(SELECTOR_TEXTAREA)).not.toBeNull();
  });

  it("renders a submit button", () => {
    component = mount(SignWorkspace, {
      target: container,
      props: { plaintext: PLAINTEXT }
    });

    expect(container.querySelector(SELECTOR_SUBMIT)).not.toBeNull();
  });

  it("renders a form with POST method", () => {
    component = mount(SignWorkspace, {
      target: container,
      props: { plaintext: PLAINTEXT }
    });

    expect(container.querySelector(SELECTOR_FORM_POST)).not.toBeNull();
  });
});
