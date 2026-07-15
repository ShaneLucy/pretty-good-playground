import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import TwoPanel from "$lib/components/layout/TwoPanel.svelte";

const LEFT_TEXT = "Left content";
const RIGHT_TEXT = "Right content";
const LEFT_HTML = `<span>${LEFT_TEXT}</span>`;
const RIGHT_HTML = `<span>${RIGHT_TEXT}</span>`;
const ID_INSTRUCTION = "#instruction";
const ID_WORKSPACE = "#workspace";
const SELECTOR_LINK_INSTRUCTION = 'a[href="#instruction"]';
const SELECTOR_LINK_WORKSPACE = 'a[href="#workspace"]';

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

const left = createRawSnippet(() => ({ render: () => LEFT_HTML }));
const right = createRawSnippet(() => ({ render: () => RIGHT_HTML }));

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) {
    unmount(component);
  }
});

describe("TwoPanel — sections", () => {
  it("renders the instruction section", () => {
    component = mount(TwoPanel, { target: container, props: { left, right } });

    expect(container.querySelector(ID_INSTRUCTION)).not.toBeNull();
  });

  it("renders the workspace section", () => {
    component = mount(TwoPanel, { target: container, props: { left, right } });

    expect(container.querySelector(ID_WORKSPACE)).not.toBeNull();
  });

  it("renders left snippet content inside the instruction section", () => {
    component = mount(TwoPanel, { target: container, props: { left, right } });

    expect(container.querySelector(ID_INSTRUCTION)?.textContent).toContain(LEFT_TEXT);
  });

  it("renders right snippet content inside the workspace section", () => {
    component = mount(TwoPanel, { target: container, props: { left, right } });

    expect(container.querySelector(ID_WORKSPACE)?.textContent).toContain(RIGHT_TEXT);
  });
});

describe("TwoPanel — navigation", () => {
  it("renders tab navigation links", () => {
    component = mount(TwoPanel, { target: container, props: { left, right } });

    expect(container.querySelector(SELECTOR_LINK_INSTRUCTION)).not.toBeNull();
    expect(container.querySelector(SELECTOR_LINK_WORKSPACE)).not.toBeNull();
  });
});
