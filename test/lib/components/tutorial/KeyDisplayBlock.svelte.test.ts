import { mount, unmount } from "svelte";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import KeyDisplayBlock from "$lib/components/tutorial/KeyDisplayBlock.svelte";

const ARMORED_KEY = "---BEGIN PGP---";
const DOWNLOAD_HREF = "/keys" as const;
const FINGERPRINT = "AABBCCDDEEFF0011";
// The component renders fingerprint.slice(-8).toUpperCase()
const FINGERPRINT_LAST_EIGHT = "EEFF0011";
const SELECTOR_DOWNLOAD = "a[download]";
const SELECTOR_PRE = "pre";

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

describe("KeyDisplayBlock — download link", () => {
  it("renders a download link", () => {
    component = mount(KeyDisplayBlock, {
      target: container,
      props: { armoredKey: ARMORED_KEY, downloadHref: DOWNLOAD_HREF, fingerprint: FINGERPRINT }
    });

    expect(container.querySelector(SELECTOR_DOWNLOAD)).not.toBeNull();
  });
});

describe("KeyDisplayBlock — fingerprint", () => {
  it("renders the last 8 chars of fingerprint", () => {
    component = mount(KeyDisplayBlock, {
      target: container,
      props: { armoredKey: ARMORED_KEY, downloadHref: DOWNLOAD_HREF, fingerprint: FINGERPRINT }
    });

    expect(container.textContent).toContain(FINGERPRINT_LAST_EIGHT);
  });
});

describe("KeyDisplayBlock — armored key", () => {
  it("renders the armored key inside a pre block", () => {
    component = mount(KeyDisplayBlock, {
      target: container,
      props: { armoredKey: ARMORED_KEY, downloadHref: DOWNLOAD_HREF, fingerprint: FINGERPRINT }
    });

    expect(container.querySelector(SELECTOR_PRE)?.textContent).toContain(ARMORED_KEY);
  });
});
