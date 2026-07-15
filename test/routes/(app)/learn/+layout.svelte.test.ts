import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Layout from "../../../../src/routes/(app)/learn/+layout.svelte";

const CHILDREN_TEXT = "Lesson content here";
const CHILDREN_HTML = `<p>${CHILDREN_TEXT}</p>`;
const CLASS_LEARN_LAYOUT = ".learn-layout";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

const children = createRawSnippet(() => ({ render: () => CHILDREN_HTML }));

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) {
    unmount(component);
  }
});

describe("learn layout — wrapper", () => {
  it("renders the learn-layout wrapper element", () => {
    component = mount(Layout, { target: container, props: { children } });

    expect(container.querySelector(CLASS_LEARN_LAYOUT)).not.toBeNull();
  });

  it("renders children inside the layout wrapper", () => {
    component = mount(Layout, { target: container, props: { children } });

    expect(container.querySelector(CLASS_LEARN_LAYOUT)?.textContent).toContain(CHILDREN_TEXT);
  });

  it("renders children snippet content", () => {
    component = mount(Layout, { target: container, props: { children } });

    expect(container.textContent).toContain(CHILDREN_TEXT);
  });
});
