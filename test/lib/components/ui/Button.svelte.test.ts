import { mount, unmount, createRawSnippet } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import Button from "$lib/components/ui/Button.svelte";

const BUTTON_LABEL = "Click me";
const BUTTON_HTML = `<span>${BUTTON_LABEL}</span>`;

const VARIANT_PRIMARY = "primary";
const VARIANT_SECONDARY = "secondary";
const VARIANT_GHOST = "ghost";
const VARIANT_DANGER = "danger";

const SIZE_SM = "sm";
const SIZE_MD = "md";
const SIZE_LG = "lg";

const TYPE_SUBMIT = "submit";
const TYPE_RESET = "reset";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

const children = createRawSnippet(() => ({
  render: () => BUTTON_HTML,
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

describe("Button — default props", () => {
  it("renders a button element", () => {
    component = mount(Button, { target: container, props: { children } });

    expect(container.querySelector("button")).not.toBeNull();
  });

  it("applies the primary variant class by default", () => {
    component = mount(Button, { target: container, props: { children } });

    expect(container.querySelector(`.btn--${VARIANT_PRIMARY}`)).not.toBeNull();
  });

  it("applies the md size class by default", () => {
    component = mount(Button, { target: container, props: { children } });

    expect(container.querySelector(`.btn--${SIZE_MD}`)).not.toBeNull();
  });

  it("has type=button by default", () => {
    component = mount(Button, { target: container, props: { children } });

    const btn = container.querySelector("button");

    expect(btn?.getAttribute("type")).toBe("button");
  });

  it("is not disabled by default", () => {
    component = mount(Button, { target: container, props: { children } });

    const btn = container.querySelector("button");

    expect(btn?.disabled).toBe(false);
  });

  it("renders the children content", () => {
    component = mount(Button, { target: container, props: { children } });

    expect(container.textContent).toContain(BUTTON_LABEL);
  });
});

describe("Button — variant prop", () => {
  it("applies the secondary variant class", () => {
    component = mount(Button, {
      target: container,
      props: { variant: VARIANT_SECONDARY, children }
    });

    expect(container.querySelector(`.btn--${VARIANT_SECONDARY}`)).not.toBeNull();
  });

  it("applies the ghost variant class", () => {
    component = mount(Button, {
      target: container,
      props: { variant: VARIANT_GHOST, children }
    });

    expect(container.querySelector(`.btn--${VARIANT_GHOST}`)).not.toBeNull();
  });

  it("applies the danger variant class", () => {
    component = mount(Button, {
      target: container,
      props: { variant: VARIANT_DANGER, children }
    });

    expect(container.querySelector(`.btn--${VARIANT_DANGER}`)).not.toBeNull();
  });
});

describe("Button — size prop", () => {
  it("applies the sm size class", () => {
    component = mount(Button, {
      target: container,
      props: { size: SIZE_SM, children }
    });

    expect(container.querySelector(`.btn--${SIZE_SM}`)).not.toBeNull();
  });

  it("applies the lg size class", () => {
    component = mount(Button, {
      target: container,
      props: { size: SIZE_LG, children }
    });

    expect(container.querySelector(`.btn--${SIZE_LG}`)).not.toBeNull();
  });
});

describe("Button — type prop", () => {
  it("sets type=submit when specified", () => {
    component = mount(Button, {
      target: container,
      props: { type: TYPE_SUBMIT, children }
    });

    expect(container.querySelector("button")?.getAttribute("type")).toBe(TYPE_SUBMIT);
  });

  it("sets type=reset when specified", () => {
    component = mount(Button, {
      target: container,
      props: { type: TYPE_RESET, children }
    });

    expect(container.querySelector("button")?.getAttribute("type")).toBe(TYPE_RESET);
  });
});

describe("Button — disabled prop", () => {
  it("disables the button when disabled=true", () => {
    component = mount(Button, {
      target: container,
      props: { disabled: true, children }
    });

    expect(container.querySelector("button")?.disabled).toBe(true);
  });
});
