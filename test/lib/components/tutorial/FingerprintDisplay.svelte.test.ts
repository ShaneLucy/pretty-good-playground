import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import FingerprintDisplay from "$lib/components/tutorial/FingerprintDisplay.svelte";

const FINGERPRINT_FULL = "AABBCCDD11223344";
const FINGERPRINT_SHORT_INPUT = "AABBCCDD";
const FINGERPRINT_FIRST_GROUP = "AABB";
// The component slices the last 8 chars of FINGERPRINT_FULL: "11223344"
// then formats in groups of 4: "1122 3344"
const FINGERPRINT_SHORT_FORMATTED_FIRST_GROUP = "1122";
const FINGERPRINT_FORMATTED_TWO_GROUPS = "AABB CCDD";
const VARIANT_FULL = "full" as const;
const VARIANT_SHORT = "short" as const;
const VARIANT_LARGE = "large" as const;
const CLASS_FINGERPRINT_LARGE = ".fingerprint--large";
const CLASS_SR_ONLY = ".sr-only";
const SELECTOR_CODE = "code";

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

describe("FingerprintDisplay — full variant (default)", () => {
  it("renders the full fingerprint by default", () => {
    component = mount(FingerprintDisplay, {
      target: container,
      props: { fingerprint: FINGERPRINT_FULL }
    });

    const code = container.querySelector(SELECTOR_CODE);

    expect(code?.textContent).toContain(FINGERPRINT_FIRST_GROUP);
  });

  it("formats fingerprint in groups of 4", () => {
    component = mount(FingerprintDisplay, {
      target: container,
      props: { fingerprint: FINGERPRINT_SHORT_INPUT }
    });

    const code = container.querySelector(SELECTOR_CODE);

    expect(code?.textContent).toContain(FINGERPRINT_FORMATTED_TWO_GROUPS);
  });

  it("does not render sr-only text for full variant", () => {
    component = mount(FingerprintDisplay, {
      target: container,
      props: { fingerprint: FINGERPRINT_FULL, variant: VARIANT_FULL }
    });

    expect(container.querySelector(CLASS_SR_ONLY)).toBeNull();
  });
});

describe("FingerprintDisplay — short variant", () => {
  it("renders only the last 8 chars in short variant", () => {
    component = mount(FingerprintDisplay, {
      target: container,
      props: { fingerprint: FINGERPRINT_FULL, variant: VARIANT_SHORT }
    });

    const code = container.querySelector(SELECTOR_CODE);

    expect(code?.textContent).not.toContain(FINGERPRINT_FIRST_GROUP);
    expect(code?.textContent).toContain(FINGERPRINT_SHORT_FORMATTED_FIRST_GROUP);
  });

  it("renders sr-only text for short variant", () => {
    component = mount(FingerprintDisplay, {
      target: container,
      props: { fingerprint: FINGERPRINT_FULL, variant: VARIANT_SHORT }
    });

    expect(container.querySelector(CLASS_SR_ONLY)).not.toBeNull();
  });
});

describe("FingerprintDisplay — large variant", () => {
  it("applies the variant class to the container", () => {
    component = mount(FingerprintDisplay, {
      target: container,
      props: { fingerprint: FINGERPRINT_FULL, variant: VARIANT_LARGE }
    });

    expect(container.querySelector(CLASS_FINGERPRINT_LARGE)).not.toBeNull();
  });
});
