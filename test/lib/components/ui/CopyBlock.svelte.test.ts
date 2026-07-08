import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import CopyBlock from "$lib/components/ui/CopyBlock.svelte";

const SAMPLE_TEXT = "Hello, World!";
const LABEL_TEXT = "Sample code block";
const COPY_BUTTON_INITIAL_TEXT = "Copy";
const COPY_BUTTON_COPIED_TEXT = "Copied!";
const COPY_ARIA_LABEL = "Copy to clipboard";
const COPIED_ARIA_LABEL = "Copied to clipboard";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

beforeEach(() => {
  container.innerHTML = "";
  // Provide a minimal clipboard stub so the copy action succeeds
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    writable: true,
    configurable: true
  });
});

afterEach(() => {
  if (component) unmount(component);
});

describe("CopyBlock — rendering", () => {
  it("renders a pre element containing the provided text", () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT }
    });

    const pre = container.querySelector("pre");

    expect(pre?.textContent).toBe(SAMPLE_TEXT);
  });

  it("renders the copy button", () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT }
    });

    const btn = container.querySelector("button");

    expect(btn).not.toBeNull();
  });

  it("shows Copy as the initial button label", () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT }
    });

    const btn = container.querySelector("button");

    expect(btn?.textContent?.trim()).toBe(COPY_BUTTON_INITIAL_TEXT);
  });

  it("sets aria-label to Copy to clipboard initially", () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT }
    });

    const btn = container.querySelector("button");

    expect(btn?.getAttribute("aria-label")).toBe(COPY_ARIA_LABEL);
  });

  it("sets the container aria-label when a label prop is provided", () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT, label: LABEL_TEXT }
    });

    const wrapper = container.querySelector(".copy-block");

    expect(wrapper?.getAttribute("aria-label")).toBe(LABEL_TEXT);
  });
});

describe("CopyBlock — copy interaction", () => {
  it("changes button text to Copied! after clicking", async () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT }
    });

    const btn = container.querySelector("button")!;

    btn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(btn.textContent?.trim()).toBe(COPY_BUTTON_COPIED_TEXT);
  });

  it("updates aria-label to Copied to clipboard after clicking", async () => {
    component = mount(CopyBlock, {
      target: container,
      props: { text: SAMPLE_TEXT }
    });

    const btn = container.querySelector("button")!;

    btn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(btn.getAttribute("aria-label")).toBe(COPIED_ARIA_LABEL);
  });
});
