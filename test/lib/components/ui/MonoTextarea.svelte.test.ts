import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import MonoTextarea from "$lib/components/ui/MonoTextarea.svelte";

const FIELD_NAME = "message";
const FIELD_LABEL = "Your message";
const ERROR_TEXT = "This field is required";
const PLACEHOLDER_TEXT = "Enter your message here";

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

describe("MonoTextarea — basic rendering", () => {
  it("renders a textarea element", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("textarea")).not.toBeNull();
  });

  it("renders a label with the correct text", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const label = container.querySelector("label");

    expect(label?.textContent?.trim()).toBe(FIELD_LABEL);
  });

  it("associates label with textarea via id", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const label = container.querySelector("label");
    const textarea = container.querySelector("textarea");

    expect(label?.getAttribute("for")).toBe(textarea?.id);
  });

  it("sets the name attribute on the textarea", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("name")).toBe(FIELD_NAME);
  });

  it("uses field-{name} as the default id", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.id).toBe(`field-${FIELD_NAME}`);
  });

  it("renders a placeholder when provided", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, placeholder: PLACEHOLDER_TEXT }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("placeholder")).toBe(PLACEHOLDER_TEXT);
  });
});

describe("MonoTextarea — required prop", () => {
  it("sets aria-required when required=true", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, required: true }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("aria-required")).toBe("true");
  });

  it("does not set aria-required when required is not specified", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("aria-required")).toBeNull();
  });
});

describe("MonoTextarea — error prop", () => {
  it("renders the error message when error is provided", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT }
    });

    expect(container.textContent).toContain(ERROR_TEXT);
  });

  it("sets aria-invalid=true when error is provided", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("aria-invalid")).toBe("true");
  });

  it("sets aria-describedby pointing to the error element", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT }
    });

    const textarea = container.querySelector("textarea");
    const errorEl = container.querySelector(".form-error");

    expect(textarea?.getAttribute("aria-describedby")).toBe(errorEl?.id);
  });

  it("does not render an error message when error is not provided", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector(".form-error")).toBeNull();
  });

  it("does not set aria-invalid when there is no error", () => {
    component = mount(MonoTextarea, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const textarea = container.querySelector("textarea");

    expect(textarea?.getAttribute("aria-invalid")).toBeNull();
  });
});
