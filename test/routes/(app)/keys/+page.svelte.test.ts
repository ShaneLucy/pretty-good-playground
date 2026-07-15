import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Page from "../../../../src/routes/(app)/keys/+page.svelte";

const ARMORED_PUBLIC_KEY =
  "-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----";
const FINGERPRINT = "ABCD1234EFGH5678ABCD1234EFGH5678ABCD1234";
const HEADING_TEXT = "Key Management";
const SECTION_HEADING_YOUR_KEY = "Your Key";
const SECTION_HEADING_DANGER = "Danger Zone";
const DEREGISTER_BUTTON_TEXT = "Deregister this key";
const LABEL_FINGERPRINT = "Fingerprint";
const SELECTOR_FORM = "form";
const SELECTOR_BUTTON = "button";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

function makeData() {
  return {
    armoredPublicKey: ARMORED_PUBLIC_KEY,
    fingerprint: FINGERPRINT,
    user: {
      fingerprint: FINGERPRINT,
      displayName: "Test User",
      publicKey: ARMORED_PUBLIC_KEY
    },
    flash: null
  };
}

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) {
    unmount(component);
  }
});

describe("keys page — heading", () => {
  it("renders the page heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(HEADING_TEXT);
  });
});

describe("keys page — your key section", () => {
  it("renders the Your Key section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(SECTION_HEADING_YOUR_KEY);
  });

  it("renders the fingerprint label", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(LABEL_FINGERPRINT);
  });
});

describe("keys page — danger zone", () => {
  it("renders the Danger Zone section heading", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(SECTION_HEADING_DANGER);
  });

  it("renders the deregister form", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.querySelector(SELECTOR_FORM)).not.toBeNull();
  });

  it("renders the deregister submit button", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    expect(container.textContent).toContain(DEREGISTER_BUTTON_TEXT);
  });

  it("renders the submit button as disabled when confirmation input is empty", () => {
    component = mount(Page, { target: container, props: { data: makeData(), form: null } });

    const button = container.querySelector<HTMLButtonElement>(SELECTOR_BUTTON);
    expect(button?.disabled).toBe(true);
  });
});
