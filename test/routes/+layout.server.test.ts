import { describe, it, expect } from "vitest";
import type { FlashMessage } from "$lib/shared/types";

const TEST_FINGERPRINT = "AABBCCDD11223344AABBCCDD11223344AABBCCDD";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY =
  "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----";

const TEST_FLASH_MESSAGE: FlashMessage = { type: "success", message: "Welcome back!" };

const TEST_USER = {
  fingerprint: TEST_FINGERPRINT,
  displayName: TEST_DISPLAY_NAME,
  publicKey: TEST_PUBLIC_KEY
};

interface LayoutLoadResult {
  user: App.Locals["user"];
  flash: App.Locals["flash"];
}

async function callLoad(locals: App.Locals): Promise<LayoutLoadResult> {
  const { load } = await import("../../src/routes/+layout.server");
  return (load as unknown as (event: { locals: App.Locals }) => LayoutLoadResult)({ locals });
}

describe("layout load — user in locals", () => {
  it("returns the user from locals when user is set", async () => {
    const result = await callLoad({ user: TEST_USER, flash: null });

    expect(result.user).toEqual(TEST_USER);
  });

  it("returns null for user when locals.user is null", async () => {
    const result = await callLoad({ user: null, flash: null });

    expect(result.user).toBeNull();
  });
});

describe("layout load — flash in locals", () => {
  it("returns the flash message from locals when flash is set", async () => {
    const result = await callLoad({ user: null, flash: TEST_FLASH_MESSAGE });

    expect(result.flash).toEqual(TEST_FLASH_MESSAGE);
  });

  it("returns null for flash when locals.flash is null", async () => {
    const result = await callLoad({ user: null, flash: null });

    expect(result.flash).toBeNull();
  });
});
