import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import QuizWorkspace from "$lib/components/workspaces/QuizWorkspace.svelte";

const QUESTION_TEXT = "What does PGP stand for?";
const OPTION_A = "Pretty Good Privacy";
const OPTION_B = "Pretty Good Protocol";
const OPTION_C = "Private Good Privacy";
const OPTIONS_TWO = [OPTION_A, OPTION_B] as const;
const OPTIONS_THREE = [OPTION_A, OPTION_B, OPTION_C] as const;
const RADIO_NAME = "selectedOption";
const RADIO_VALUE_FIRST = "0";
const RADIO_VALUE_SECOND = "1";
const SELECTOR_RADIO = 'input[type="radio"]';
const SELECTOR_SUBMIT = 'button[type="submit"]';
const ATTR_NAME = "name";
const ATTR_VALUE = "value";
const EXPECTED_RADIO_COUNT_THREE = 3;

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

describe("QuizWorkspace — question", () => {
  it("renders the question text", () => {
    component = mount(QuizWorkspace, {
      target: container,
      props: { question: QUESTION_TEXT, options: OPTIONS_TWO }
    });

    expect(container.textContent).toContain(QUESTION_TEXT);
  });
});

describe("QuizWorkspace — options", () => {
  it("renders a radio button for each option", () => {
    component = mount(QuizWorkspace, {
      target: container,
      props: { question: QUESTION_TEXT, options: OPTIONS_THREE }
    });

    expect(container.querySelectorAll(SELECTOR_RADIO)).toHaveLength(EXPECTED_RADIO_COUNT_THREE);
  });

  it("renders option text", () => {
    component = mount(QuizWorkspace, {
      target: container,
      props: { question: QUESTION_TEXT, options: OPTIONS_TWO }
    });

    expect(container.textContent).toContain(OPTION_A);
    expect(container.textContent).toContain(OPTION_B);
  });

  it("all radios have the same name attribute", () => {
    component = mount(QuizWorkspace, {
      target: container,
      props: { question: QUESTION_TEXT, options: OPTIONS_TWO }
    });

    const radios = container.querySelectorAll<HTMLInputElement>(SELECTOR_RADIO);

    radios.forEach((radio) => {
      expect(radio.getAttribute(ATTR_NAME)).toBe(RADIO_NAME);
    });
  });

  it("radio values are their index as string", () => {
    component = mount(QuizWorkspace, {
      target: container,
      props: { question: QUESTION_TEXT, options: OPTIONS_TWO }
    });

    const radios = container.querySelectorAll<HTMLInputElement>(SELECTOR_RADIO);

    expect(radios[0]?.getAttribute(ATTR_VALUE)).toBe(RADIO_VALUE_FIRST);
    expect(radios[1]?.getAttribute(ATTR_VALUE)).toBe(RADIO_VALUE_SECOND);
  });
});

describe("QuizWorkspace — submit", () => {
  it("renders a submit button", () => {
    component = mount(QuizWorkspace, {
      target: container,
      props: { question: QUESTION_TEXT, options: OPTIONS_TWO }
    });

    expect(container.querySelector(SELECTOR_SUBMIT)).not.toBeNull();
  });
});
