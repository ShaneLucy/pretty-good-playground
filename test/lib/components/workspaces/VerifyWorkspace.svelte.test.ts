import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import VerifyWorkspace from "$lib/components/workspaces/VerifyWorkspace.svelte";

const SIGNED_MESSAGE = "-----BEGIN PGP SIGNED MESSAGE-----";
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

describe("VerifyWorkspace — signed message", () => {
  it("renders the signed message in a copyable block", () => {
    component = mount(VerifyWorkspace, {
      target: container,
      props: { signedMessage: SIGNED_MESSAGE }
    });

    expect(container.textContent).toContain(SIGNED_MESSAGE);
  });
});

describe("VerifyWorkspace — form elements", () => {
  it("renders a submit button", () => {
    component = mount(VerifyWorkspace, {
      target: container,
      props: { signedMessage: SIGNED_MESSAGE }
    });

    expect(container.querySelector(SELECTOR_SUBMIT)).not.toBeNull();
  });

  it("renders a form with POST method", () => {
    component = mount(VerifyWorkspace, {
      target: container,
      props: { signedMessage: SIGNED_MESSAGE }
    });

    expect(container.querySelector(SELECTOR_FORM_POST)).not.toBeNull();
  });
});
