import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import FlashBanner from "$lib/components/layout/FlashBanner.svelte";
import type { FlashMessage } from "$lib/shared/types";

const SUCCESS_MESSAGE = "Profile updated successfully.";
const ERROR_MESSAGE = "Something went wrong.";
const WARNING_MESSAGE = "Your session is about to expire.";
const INFO_MESSAGE = "New lessons are available.";

const ROLE_ALERT = "alert";
const ROLE_STATUS = "status";

let component: ReturnType<typeof mount>;
const container = document.createElement("div");
document.body.appendChild(container);

beforeEach(() => {
  container.innerHTML = "";
});

afterEach(() => {
  if (component) unmount(component);
});

describe("FlashBanner — null flash", () => {
  it("renders nothing when flash is null", () => {
    component = mount(FlashBanner, {
      target: container,
      props: { flash: null }
    });

    expect(container.querySelector(".flash-banner")).toBeNull();
  });
});

describe("FlashBanner — success flash", () => {
  it("renders the banner with the success message", () => {
    const flash: FlashMessage = { type: "success", message: SUCCESS_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    expect(container.textContent).toContain(SUCCESS_MESSAGE);
  });

  it("uses role=status for a success flash", () => {
    const flash: FlashMessage = { type: "success", message: SUCCESS_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    const banner = container.querySelector(".flash-banner");

    expect(banner?.getAttribute("role")).toBe(ROLE_STATUS);
  });

  it("applies the success modifier class", () => {
    const flash: FlashMessage = { type: "success", message: SUCCESS_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    expect(container.querySelector(".flash-banner--success")).not.toBeNull();
  });
});

describe("FlashBanner — error flash", () => {
  it("renders the banner with the error message", () => {
    const flash: FlashMessage = { type: "error", message: ERROR_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    expect(container.textContent).toContain(ERROR_MESSAGE);
  });

  it("uses role=alert for an error flash", () => {
    const flash: FlashMessage = { type: "error", message: ERROR_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    const banner = container.querySelector(".flash-banner");

    expect(banner?.getAttribute("role")).toBe(ROLE_ALERT);
  });

  it("applies the error modifier class", () => {
    const flash: FlashMessage = { type: "error", message: ERROR_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    expect(container.querySelector(".flash-banner--error")).not.toBeNull();
  });
});

describe("FlashBanner — warning flash", () => {
  it("renders the banner with the warning message", () => {
    const flash: FlashMessage = { type: "warning", message: WARNING_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    expect(container.textContent).toContain(WARNING_MESSAGE);
  });

  it("uses role=status for a warning flash", () => {
    const flash: FlashMessage = { type: "warning", message: WARNING_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    const banner = container.querySelector(".flash-banner");

    expect(banner?.getAttribute("role")).toBe(ROLE_STATUS);
  });
});

describe("FlashBanner — info flash", () => {
  it("renders the banner with the info message", () => {
    const flash: FlashMessage = { type: "info", message: INFO_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    expect(container.textContent).toContain(INFO_MESSAGE);
  });

  it("uses role=status for an info flash", () => {
    const flash: FlashMessage = { type: "info", message: INFO_MESSAGE };

    component = mount(FlashBanner, {
      target: container,
      props: { flash }
    });

    const banner = container.querySelector(".flash-banner");

    expect(banner?.getAttribute("role")).toBe(ROLE_STATUS);
  });
});
