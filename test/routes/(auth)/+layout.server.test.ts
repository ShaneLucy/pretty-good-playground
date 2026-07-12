import { describe, it, expect } from "vitest";
import { load } from "../../../src/routes/(auth)/+layout.server";

const DASHBOARD_PATH = "/dashboard";

const TEST_USER = {
  fingerprint: "AABBCCDD11223344AABBCCDD11223344AABBCCDD",
  displayName: "Test User",
  publicKey: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nfake\n-----END PGP PUBLIC KEY BLOCK-----"
};

function captureRedirect(locals: Parameters<typeof load>[0]["locals"]): string | null {
  try {
    load({ locals } as unknown as Parameters<typeof load>[0]);
    return null;
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "location" in e &&
      typeof (e as Record<string, unknown>).location === "string"
    ) {
      return (e as Record<string, unknown>).location as string;
    }
    return null;
  }
}

describe("auth layout load — user present", () => {
  it("throws a redirect to /dashboard when locals.user is truthy", () => {
    const redirectedTo = captureRedirect({ user: TEST_USER, flash: null });

    expect(redirectedTo).toBe(DASHBOARD_PATH);
  });
});

describe("auth layout load — no user", () => {
  it("returns empty object when locals.user is null", () => {
    const result = load({ locals: { user: null, flash: null } } as unknown as Parameters<
      typeof load
    >[0]);

    expect(result).toEqual({});
  });
});
