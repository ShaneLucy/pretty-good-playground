import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import StepIndicator from "$lib/components/tutorial/StepIndicator.svelte";

const STEP_SIGN = "Sign";
const STEP_VERIFY = "Verify";
const STEP_ENCRYPT = "Encrypt";
const STEP_A = "A";
const STEP_B = "B";
const STEP_C = "C";
const STEPS_THREE = [STEP_SIGN, STEP_VERIFY, STEP_ENCRYPT];
const STEPS_TWO = [STEP_SIGN, STEP_VERIFY];
const STEPS_ABC = [STEP_A, STEP_B, STEP_C];
const STEPS_AB = [STEP_A, STEP_B];
const CURRENT_STEP_ZERO = 0;
const CURRENT_STEP_ONE = 1;
const CURRENT_STEP_TWO = 2;
const ARIA_CURRENT_STEP = "step";
const ICON_CHECKMARK = "✓";
const CLASS_ITEM_COMPLETED = ".step-indicator__item--completed";
const CLASS_CONNECTOR = ".step-indicator__connector";
const CLASS_COMPLETED_MARKER = ".step-indicator__item--completed .step-indicator__marker";
const ATTR_ARIA_CURRENT = "aria-current";
const EXPECTED_COMPLETED_COUNT_ABC = 2;
const EXPECTED_CONNECTOR_COUNT_THREE = 2;

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

describe("StepIndicator — labels", () => {
  it("renders all step labels", () => {
    component = mount(StepIndicator, {
      target: container,
      props: { steps: STEPS_THREE, currentStep: CURRENT_STEP_ONE }
    });

    expect(container.textContent).toContain(STEP_SIGN);
    expect(container.textContent).toContain(STEP_VERIFY);
    expect(container.textContent).toContain(STEP_ENCRYPT);
  });
});

describe("StepIndicator — current step", () => {
  it("marks the current step with aria-current=step", () => {
    component = mount(StepIndicator, {
      target: container,
      props: { steps: STEPS_TWO, currentStep: CURRENT_STEP_ZERO }
    });

    const current = container.querySelector(`[${ATTR_ARIA_CURRENT}="${ARIA_CURRENT_STEP}"]`);

    expect(current?.textContent).toContain(STEP_SIGN);
  });
});

describe("StepIndicator — completed steps", () => {
  it("marks completed steps with the completed class", () => {
    component = mount(StepIndicator, {
      target: container,
      props: { steps: STEPS_ABC, currentStep: CURRENT_STEP_TWO }
    });

    expect(container.querySelectorAll(CLASS_ITEM_COMPLETED)).toHaveLength(
      EXPECTED_COMPLETED_COUNT_ABC
    );
  });

  it("shows checkmark in completed step markers", () => {
    component = mount(StepIndicator, {
      target: container,
      props: { steps: STEPS_AB, currentStep: CURRENT_STEP_ONE }
    });

    const completedMarker = container.querySelector(CLASS_COMPLETED_MARKER);

    expect(completedMarker?.textContent).toContain(ICON_CHECKMARK);
  });
});

describe("StepIndicator — connectors", () => {
  it("renders connectors between steps except the last", () => {
    component = mount(StepIndicator, {
      target: container,
      props: { steps: STEPS_THREE, currentStep: CURRENT_STEP_ZERO }
    });

    expect(container.querySelectorAll(CLASS_CONNECTOR)).toHaveLength(
      EXPECTED_CONNECTOR_COUNT_THREE
    );
  });
});
