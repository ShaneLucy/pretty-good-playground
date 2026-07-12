import { describe, it, expect } from "vitest";
import {
  getMainKv,
  getEphemeralKv,
  userKey,
  progressKey,
  flashKey,
  challengeKey,
  pendingAuthKey,
  rateLimitKey
} from "$lib/server/kv";

const TEST_FINGERPRINT = "ABCDEF1234567890";
const TEST_NONCE = "deadbeef";
const TEST_ENDPOINT = "login";
const TEST_IDENTIFIER = "test-client-id";
const TEST_MINUTE = 12345;
const TEST_VALUE = "stored-value";
const MISSING_KEY = "does-not-exist";

describe("getMainKv (dev store)", () => {
  it("returns a stored value after put", async () => {
    const kv = getMainKv(undefined);

    await kv.put(TEST_FINGERPRINT, TEST_VALUE);
    const result = await kv.get(TEST_FINGERPRINT);

    expect(result).toBe(TEST_VALUE);
  });

  it("returns null for a missing key", async () => {
    const kv = getMainKv(undefined);

    const result = await kv.get(MISSING_KEY);

    expect(result).toBeNull();
  });

  it("removes the key after delete", async () => {
    const kv = getMainKv(undefined);
    await kv.put(TEST_FINGERPRINT, TEST_VALUE);

    await kv.delete(TEST_FINGERPRINT);
    const result = await kv.get(TEST_FINGERPRINT);

    expect(result).toBeNull();
  });
});

describe("getEphemeralKv (dev store)", () => {
  it("returns a stored value after put", async () => {
    const kv = getEphemeralKv(undefined);

    await kv.put(TEST_FINGERPRINT, TEST_VALUE);
    const result = await kv.get(TEST_FINGERPRINT);

    expect(result).toBe(TEST_VALUE);
  });

  it("returns null for a missing key", async () => {
    const kv = getEphemeralKv(undefined);

    const result = await kv.get(MISSING_KEY + "-ephemeral");

    expect(result).toBeNull();
  });

  it("removes the key after delete", async () => {
    const kv = getEphemeralKv(undefined);
    await kv.put(TEST_FINGERPRINT, TEST_VALUE);

    await kv.delete(TEST_FINGERPRINT);
    const result = await kv.get(TEST_FINGERPRINT);

    expect(result).toBeNull();
  });
});

describe("key-formatting functions", () => {
  it("userKey returns expected format", () => {
    expect(userKey(TEST_FINGERPRINT)).toBe(`user:v1:${TEST_FINGERPRINT}`);
  });

  it("progressKey returns expected format", () => {
    expect(progressKey(TEST_FINGERPRINT)).toBe(`progress:v1:${TEST_FINGERPRINT}`);
  });

  it("flashKey returns expected format", () => {
    expect(flashKey(TEST_FINGERPRINT)).toBe(`flash:v1:${TEST_FINGERPRINT}`);
  });

  it("challengeKey returns expected format", () => {
    expect(challengeKey(TEST_FINGERPRINT, TEST_NONCE)).toBe(
      `challenge:v1:${TEST_FINGERPRINT}:${TEST_NONCE}`
    );
  });

  it("pendingAuthKey returns expected format", () => {
    expect(pendingAuthKey(TEST_FINGERPRINT)).toBe(`pending_auth:v1:${TEST_FINGERPRINT}`);
  });

  it("rateLimitKey returns expected format", () => {
    expect(rateLimitKey(TEST_ENDPOINT, TEST_IDENTIFIER, TEST_MINUTE)).toBe(
      `rl:v1:${TEST_ENDPOINT}:${TEST_IDENTIFIER}:${TEST_MINUTE}`
    );
  });
});
