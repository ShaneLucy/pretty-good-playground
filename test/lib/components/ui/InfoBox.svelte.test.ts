import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import InfoBox from "$lib/components/ui/InfoBox.svelte";

const CHILDREN_TEXT = "This is important information";
const CHILDREN_HTML = `<p>${CHILDREN_TEXT}</p>`;

const CLASS_BASE = "info-box";
const VARIANT_INFO = "info";
const VARIANT_WARNING = "warning";
const VARIANT_SUCCESS = "success";
const VARIANT_DANGER = "danger";

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

describe("InfoBox — default variant", () => {
  it("renders the info-box element", () => {
    component = mount(InfoBox, { target: container, props: { children } });

    expect(container.querySelector(`.${CLASS_BASE}`)).not.toBeNull();
  });

  it("applies the info variant class by default", () => {
    component = mount(InfoBox, { target: container, props: { children } });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_INFO}`)).not.toBeNull();
  });

  it("renders the children content", () => {
    component = mount(InfoBox, { target: container, props: { children } });

    expect(container.textContent).toContain(CHILDREN_TEXT);
  });
});

describe("InfoBox — variant prop", () => {
  it("applies the warning modifier class", () => {
    component = mount(InfoBox, {
      target: container,
      props: { variant: VARIANT_WARNING, children }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_WARNING}`)).not.toBeNull();
  });

  it("applies the success modifier class", () => {
    component = mount(InfoBox, {
      target: container,
      props: { variant: VARIANT_SUCCESS, children }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_SUCCESS}`)).not.toBeNull();
  });

  it("applies the danger modifier class", () => {
    component = mount(InfoBox, {
      target: container,
      props: { variant: VARIANT_DANGER, children }
    });

    expect(container.querySelector(`.${CLASS_BASE}--${VARIANT_DANGER}`)).not.toBeNull();
  });
});
