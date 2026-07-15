import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import FileInput from "$lib/components/forms/FileInput.svelte";

const INPUT_NAME = "photo";
const INPUT_LABEL = "Upload Photo";
const INPUT_ACCEPT = ".jpg";
const ARIA_REQUIRED_TRUE = "true";
const CLASS_FORM_REQUIRED = ".form-required";
const SELECTOR_FILE_INPUT = 'input[type="file"]';
const ATTR_NAME = "name";
const ATTR_ACCEPT = "accept";
const ATTR_ARIA_REQUIRED = "aria-required";

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

describe("FileInput — label", () => {
  it("renders the label text", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT }
    });

    expect(container.textContent).toContain(INPUT_LABEL);
  });
});

describe("FileInput — input element", () => {
  it("renders a file input with the correct name attribute", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT }
    });

    const input = container.querySelector(SELECTOR_FILE_INPUT);

    expect(input?.getAttribute(ATTR_NAME)).toBe(INPUT_NAME);
  });

  it("renders the accept attribute on the input", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT }
    });

    const input = container.querySelector(SELECTOR_FILE_INPUT);

    expect(input?.getAttribute(ATTR_ACCEPT)).toBe(INPUT_ACCEPT);
  });
});

describe("FileInput — required prop", () => {
  it("does not render required marker when required is false", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT, required: false }
    });

    expect(container.querySelector(CLASS_FORM_REQUIRED)).toBeNull();
  });

  it("renders required marker when required is true", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT, required: true }
    });

    expect(container.querySelector(CLASS_FORM_REQUIRED)).not.toBeNull();
  });

  it("sets aria-required on the input when required is true", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT, required: true }
    });

    const input = container.querySelector(SELECTOR_FILE_INPUT);

    expect(input?.getAttribute(ATTR_ARIA_REQUIRED)).toBe(ARIA_REQUIRED_TRUE);
  });

  it("does not set aria-required when required is false", () => {
    component = mount(FileInput, {
      target: container,
      props: { name: INPUT_NAME, label: INPUT_LABEL, accept: INPUT_ACCEPT, required: false }
    });

    const input = container.querySelector(SELECTOR_FILE_INPUT);

    expect(input?.getAttribute(ATTR_ARIA_REQUIRED)).toBeNull();
  });
});
