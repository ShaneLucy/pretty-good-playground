import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import ExplainerWorkspace from "$lib/components/workspaces/ExplainerWorkspace.svelte";

const CHILDREN_TEXT = "Explainer body";
const CHILDREN_HTML = `<span>${CHILDREN_TEXT}</span>`;
const TEXT_MARK_COMPLETE = "Mark as complete";
const SELECTOR_FORM_POST = 'form[method="POST"]';
const SELECTOR_FORM = "form";

const children = createRawSnippet(() => ({ render: () => CHILDREN_HTML }));

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

describe("ExplainerWorkspace — no children", () => {
  it("renders without children", () => {
    component = mount(ExplainerWorkspace, {
      target: container,
      props: {}
    });

    expect(container.querySelector(SELECTOR_FORM)).not.toBeNull();
  });
});

describe("ExplainerWorkspace — children snippet", () => {
  it("renders children content when provided", () => {
    component = mount(ExplainerWorkspace, {
      target: container,
      props: { children }
    });

    expect(container.textContent).toContain(CHILDREN_TEXT);
  });
});

describe("ExplainerWorkspace — form elements", () => {
  it("renders a Mark as complete button", () => {
    component = mount(ExplainerWorkspace, {
      target: container,
      props: {}
    });

    expect(container.textContent).toContain(TEXT_MARK_COMPLETE);
  });

  it("renders a form with POST method", () => {
    component = mount(ExplainerWorkspace, {
      target: container,
      props: {}
    });

    expect(container.querySelector(SELECTOR_FORM_POST)).not.toBeNull();
  });
});
