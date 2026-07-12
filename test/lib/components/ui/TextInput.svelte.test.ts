import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import TextInput from "$lib/components/ui/TextInput.svelte";

const FIELD_NAME = "email";
const FIELD_LABEL = "Email address";
const ERROR_TEXT = "Please enter a valid email address";
const HELPER_TEXT = "We will never share your email";
const PLACEHOLDER_TEXT = "you@example.com";
const CUSTOM_ID = "my-email-field";

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

describe("TextInput — basic rendering", () => {
  it("renders an input element", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("input")).not.toBeNull();
  });

  it("renders a label with the correct text", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const label = container.querySelector("label");

    expect(label?.textContent?.trim()).toBe(FIELD_LABEL);
  });

  it("associates the label with the input via id", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    const label = container.querySelector("label");
    const input = container.querySelector("input");

    expect(label?.getAttribute("for")).toBe(input?.id);
  });

  it("sets the name attribute on the input", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("input")?.getAttribute("name")).toBe(FIELD_NAME);
  });

  it("uses field-{name} as the default id", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("input")?.id).toBe(`field-${FIELD_NAME}`);
  });

  it("uses a custom id when the id prop is provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, id: CUSTOM_ID }
    });

    expect(container.querySelector("input")?.id).toBe(CUSTOM_ID);
  });

  it("defaults to type=text", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });

  it("applies the given type attribute", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, type: "email" }
    });

    expect(container.querySelector("input")?.getAttribute("type")).toBe("email");
  });

  it("sets the placeholder attribute when provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, placeholder: PLACEHOLDER_TEXT }
    });

    expect(container.querySelector("input")?.getAttribute("placeholder")).toBe(PLACEHOLDER_TEXT);
  });
});

describe("TextInput — required prop", () => {
  it("sets aria-required when required=true", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, required: true }
    });

    expect(container.querySelector("input")?.getAttribute("aria-required")).toBe("true");
  });

  it("does not set aria-required when required is not specified", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("input")?.getAttribute("aria-required")).toBeNull();
  });
});

describe("TextInput — helper prop", () => {
  it("renders the helper text when provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, helper: HELPER_TEXT }
    });

    expect(container.textContent).toContain(HELPER_TEXT);
  });

  it("includes the helper id in aria-describedby when helper is provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, helper: HELPER_TEXT }
    });

    const input = container.querySelector("input");
    const helperEl = container.querySelector(".form-helper");
    const describedBy = input?.getAttribute("aria-describedby") ?? "";

    expect(describedBy).toContain(helperEl?.id);
  });

  it("does not render helper text when not provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector(".form-helper")).toBeNull();
  });
});

describe("TextInput — error prop", () => {
  it("renders the error message when error is provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT }
    });

    expect(container.textContent).toContain(ERROR_TEXT);
  });

  it("sets aria-invalid=true when error is provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT }
    });

    expect(container.querySelector("input")?.getAttribute("aria-invalid")).toBe("true");
  });

  it("includes the error id in aria-describedby when error is provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT }
    });

    const input = container.querySelector("input");
    const errorEl = container.querySelector(".form-error");
    const describedBy = input?.getAttribute("aria-describedby") ?? "";

    expect(describedBy).toContain(errorEl?.id);
  });

  it("does not render an error element when no error is provided", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector(".form-error")).toBeNull();
  });

  it("does not set aria-invalid when there is no error", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL }
    });

    expect(container.querySelector("input")?.getAttribute("aria-invalid")).toBeNull();
  });

  it("includes both error and helper ids in aria-describedby when both are set", () => {
    component = mount(TextInput, {
      target: container,
      props: { name: FIELD_NAME, label: FIELD_LABEL, error: ERROR_TEXT, helper: HELPER_TEXT }
    });

    const input = container.querySelector("input");
    const errorEl = container.querySelector(".form-error");
    const helperEl = container.querySelector(".form-helper");
    const describedBy = input?.getAttribute("aria-describedby") ?? "";

    expect(describedBy).toContain(errorEl?.id);
    expect(describedBy).toContain(helperEl?.id);
  });
});
