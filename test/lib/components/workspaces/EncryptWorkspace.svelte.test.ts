import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import EncryptWorkspace from "$lib/components/workspaces/EncryptWorkspace.svelte";

const RECIPIENT_PUBLIC_KEY = "RECIPIENT_KEY";
const PLAINTEXT = "hello";
const SELECTOR_TEXTAREA = 'textarea[name="ciphertext"]';
const SELECTOR_SUBMIT = 'button[type="submit"]';

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

describe("EncryptWorkspace — displayed content", () => {
  it("renders the recipient public key in a copyable block", () => {
    component = mount(EncryptWorkspace, {
      target: container,
      props: { recipientPublicKey: RECIPIENT_PUBLIC_KEY, plaintext: PLAINTEXT }
    });

    expect(container.textContent).toContain(RECIPIENT_PUBLIC_KEY);
  });

  it("renders the plaintext to encrypt", () => {
    component = mount(EncryptWorkspace, {
      target: container,
      props: { recipientPublicKey: RECIPIENT_PUBLIC_KEY, plaintext: PLAINTEXT }
    });

    expect(container.textContent).toContain(PLAINTEXT);
  });
});

describe("EncryptWorkspace — form elements", () => {
  it("renders a ciphertext textarea", () => {
    component = mount(EncryptWorkspace, {
      target: container,
      props: { recipientPublicKey: RECIPIENT_PUBLIC_KEY, plaintext: PLAINTEXT }
    });

    expect(container.querySelector(SELECTOR_TEXTAREA)).not.toBeNull();
  });

  it("renders a submit button", () => {
    component = mount(EncryptWorkspace, {
      target: container,
      props: { recipientPublicKey: RECIPIENT_PUBLIC_KEY, plaintext: PLAINTEXT }
    });

    expect(container.querySelector(SELECTOR_SUBMIT)).not.toBeNull();
  });
});
