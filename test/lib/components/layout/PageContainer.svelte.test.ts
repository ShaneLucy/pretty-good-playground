import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import PageContainer from "$lib/components/layout/PageContainer.svelte";

const CLASS_BASE = "page-container";
const VARIANT_DEFAULT = "default";
const VARIANT_WIDE = "wide";
const VARIANT_NARROW = "narrow";
const CHILDREN_HTML = `<span>inner content</span>`;
const CHILDREN_TEXT = "inner content";

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
  if (component) {
    unmount(component);
  }
});

describe("PageContainer", () => {
  it("renders the base page-container class", () => {
    component = mount(PageContainer, {
      target: container,
      props: { children }
    });

    expect(container.querySelector(`.${CLASS_BASE}`)).not.toBeNull();
  });

  it("applies the default variant class when no variant is provided", () => {
    component = mount(PageContainer, {
      target: container,
      props: { children }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_DEFAULT}`)).not.toBeNull();
  });

  it("applies the wide variant class when variant is wide", () => {
    component = mount(PageContainer, {
      target: container,
      props: { variant: VARIANT_WIDE, children }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_WIDE}`)).not.toBeNull();
  });

  it("applies the narrow variant class when variant is narrow", () => {
    component = mount(PageContainer, {
      target: container,
      props: { variant: VARIANT_NARROW, children }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_NARROW}`)).not.toBeNull();
  });

  it("renders the children snippet content", () => {
    component = mount(PageContainer, {
      target: container,
      props: { children }
    });

    expect(container.textContent).toContain(CHILDREN_TEXT);
  });
});
