import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import {
  signJwt,
  verifyJwt,
  makeSessionCookie,
  makePendingFpCookie,
  clearSessionCookie,
  clearPendingFpCookie
} from "$lib/server/auth";

const TEST_SECRET = "super-secret-key-for-testing-only";
const TEST_SUBJECT = "user-fingerprint-abc123";
const TEST_FINGERPRINT = "ABCDEF1234567890";
const EXPIRY_ONE_HOUR = "1h";
const EXPIRY_INSTANT = "0s";
const MAX_AGE_REMEMBER = "Max-Age=2592000";
const MAX_AGE_PENDING_FP = "Max-Age=300";
const MAX_AGE_ZERO = "Max-Age=0";
const COOKIE_SESSION_PREFIX = "session=";
const COOKIE_PENDING_FP_PREFIX = "pending_fp=";

describe("signJwt", () => {
  it("returns a non-empty JWT string", async () => {
    const token = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("returns a string with three dot-separated JWT parts", async () => {
    const token = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });
});

describe("verifyJwt", () => {
  it("returns the subject for a valid token", async () => {
    const token = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    const result = await verifyJwt(token, TEST_SECRET);

    expect(result).toEqual({ sub: TEST_SUBJECT });
  });

  it("returns null for a token signed with a different secret", async () => {
    const token = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    const result = await verifyJwt(token, "wrong-secret");

    expect(result).toBeNull();
  });

  it("returns null for a completely invalid token string", async () => {
    const result = await verifyJwt("not.a.token", TEST_SECRET);

    expect(result).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const token = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_INSTANT);

    const result = await verifyJwt(token, TEST_SECRET);

    expect(result).toBeNull();
  });
});

describe("verifyJwt — missing sub", () => {
  it("returns null when the token payload contains no sub field", async () => {
    const secretKey = new TextEncoder().encode(TEST_SECRET);
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(EXPIRY_ONE_HOUR)
      .sign(secretKey);

    const result = await verifyJwt(token, TEST_SECRET);

    expect(result).toBeNull();
  });
});

describe("makeSessionCookie", () => {
  it("includes the JWT in the session cookie value", async () => {
    const jwt = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    const cookie = makeSessionCookie(jwt, false);

    expect(cookie).toContain(COOKIE_SESSION_PREFIX);
    expect(cookie).toContain(encodeURIComponent(jwt));
  });

  it("includes Max-Age when rememberDevice is true", async () => {
    const jwt = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    const cookie = makeSessionCookie(jwt, true);

    expect(cookie).toContain(MAX_AGE_REMEMBER);
  });

  it("does not include Max-Age when rememberDevice is false", async () => {
    const jwt = await signJwt({ sub: TEST_SUBJECT }, TEST_SECRET, EXPIRY_ONE_HOUR);

    const cookie = makeSessionCookie(jwt, false);

    expect(cookie).not.toContain("Max-Age");
  });
});

describe("makePendingFpCookie", () => {
  it("includes the URL-encoded fingerprint", () => {
    const cookie = makePendingFpCookie(TEST_FINGERPRINT);

    expect(cookie).toContain(encodeURIComponent(TEST_FINGERPRINT));
  });

  it("includes the pending_fp cookie name", () => {
    const cookie = makePendingFpCookie(TEST_FINGERPRINT);

    expect(cookie).toContain(COOKIE_PENDING_FP_PREFIX);
  });

  it("includes Max-Age=300", () => {
    const cookie = makePendingFpCookie(TEST_FINGERPRINT);

    expect(cookie).toContain(MAX_AGE_PENDING_FP);
  });
});

describe("clearSessionCookie", () => {
  it("includes Max-Age=0 to expire the cookie", () => {
    const cookie = clearSessionCookie();

    expect(cookie).toContain(MAX_AGE_ZERO);
  });

  it("includes the session cookie name", () => {
    const cookie = clearSessionCookie();

    expect(cookie).toContain(COOKIE_SESSION_PREFIX);
  });
});

describe("clearPendingFpCookie", () => {
  it("includes Max-Age=0 to expire the cookie", () => {
    const cookie = clearPendingFpCookie();

    expect(cookie).toContain(MAX_AGE_ZERO);
  });

  it("includes the pending_fp cookie name", () => {
    const cookie = clearPendingFpCookie();

    expect(cookie).toContain(COOKIE_PENDING_FP_PREFIX);
  });
});
