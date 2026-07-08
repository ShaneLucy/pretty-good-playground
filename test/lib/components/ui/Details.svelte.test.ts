import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Details from "$lib/components/ui/Details.svelte";

const SUMMARY_TEXT = "Click to expand";
const CHILDREN_TEXT = "Hidden content here";
const CHILDREN_HTML = `<p>${CHILDREN_TEXT}</p>`;

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

const children = createRawSnippet(() => ({
  render: () => CHILDREN_HTML,
  setup: () => {}
}));

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) unmount(component);
});

describe("Details", () => {
  it("renders a details element", () => {
    component = mount(Details, {
      target: container,
      props: { summary: SUMMARY_TEXT, children }
    });

    expect(container.querySelector("details")).not.toBeNull();
  });

  it("renders the summary text", () => {
    component = mount(Details, {
      target: container,
      props: { summary: SUMMARY_TEXT, children }
    });

    const summary = container.querySelector("summary");

    expect(summary?.textContent?.trim()).toBe(SUMMARY_TEXT);
  });

  it("is closed by default", () => {
    component = mount(Details, {
      target: container,
      props: { summary: SUMMARY_TEXT, children }
    });

    const details = container.querySelector("details") as HTMLDetailsElement;

    expect(details.open).toBe(false);
  });

  it("is open when the open prop is true", () => {
    component = mount(Details, {
      target: container,
      props: { summary: SUMMARY_TEXT, open: true, children }
    });

    const details = container.querySelector("details") as HTMLDetailsElement;

    expect(details.open).toBe(true);
  });

  it("renders the children snippet content", () => {
    component = mount(Details, {
      target: container,
      props: { summary: SUMMARY_TEXT, children }
    });

    expect(container.textContent).toContain(CHILDREN_TEXT);
  });
});
