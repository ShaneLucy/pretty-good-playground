import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import DecryptWorkspace from "$lib/components/workspaces/DecryptWorkspace.svelte";

const CIPHERTEXT = "ENCRYPTED_MSG";
const SELECTOR_TEXTAREA = 'textarea[name="plaintext"]';
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

describe("DecryptWorkspace — ciphertext", () => {
  it("renders the ciphertext in a copyable block", () => {
    component = mount(DecryptWorkspace, {
      target: container,
      props: { ciphertext: CIPHERTEXT }
    });

    expect(container.textContent).toContain(CIPHERTEXT);
  });
});

describe("DecryptWorkspace — form elements", () => {
  it("renders a textarea for plaintext input", () => {
    component = mount(DecryptWorkspace, {
      target: container,
      props: { ciphertext: CIPHERTEXT }
    });

    expect(container.querySelector(SELECTOR_TEXTAREA)).not.toBeNull();
  });

  it("renders a submit button", () => {
    component = mount(DecryptWorkspace, {
      target: container,
      props: { ciphertext: CIPHERTEXT }
    });

    expect(container.querySelector(SELECTOR_SUBMIT)).not.toBeNull();
  });

  it("renders a form with POST method", () => {
    component = mount(DecryptWorkspace, {
      target: container,
      props: { ciphertext: CIPHERTEXT }
    });

    expect(container.querySelector(SELECTOR_FORM_POST)).not.toBeNull();
  });
});
