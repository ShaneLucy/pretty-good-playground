import { describe, it, expect, beforeAll } from "vitest";
import { generateKey, createCleartextMessage, sign } from "openpgp";
import { readPublicKey, extractFingerprint, verifySignature, PgpError } from "$lib/server/pgp";
import type { PublicKey, PrivateKey } from "openpgp";

const TEST_USER_ID = { name: "Test User", email: "test@example.com" };
const TEST_MESSAGE_TEXT = "Hello, world! This is a test message.";
const GARBAGE_INPUT = "not a pgp key";

let testPublicKey: PublicKey;
let armoredSignedMessage: string;
let otherPublicKey: PublicKey;

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKey({
    type: "rsa",
    rsaBits: 2048,
    userIDs: [TEST_USER_ID],
    format: "object"
  });

  const { publicKey: otherPublicKeyObj } = await generateKey({
    type: "rsa",
    rsaBits: 2048,
    userIDs: [{ name: "Other User", email: "other@example.com" }],
    format: "object"
  });

  testPublicKey = publicKey;
  otherPublicKey = otherPublicKeyObj;

  const message = await createCleartextMessage({ text: TEST_MESSAGE_TEXT });
  armoredSignedMessage = await sign({ message, signingKeys: privateKey as PrivateKey });
});

describe("readPublicKey", () => {
  it("throws PgpError for garbage input", async () => {
    await expect(readPublicKey(GARBAGE_INPUT)).rejects.toBeInstanceOf(PgpError);
  });

  it("throws PgpError with INVALID_KEY code for garbage input", async () => {
    await expect(readPublicKey("garbage")).rejects.toMatchObject({
      code: "INVALID_KEY"
    });
  });

  it("throws PgpError for empty string", async () => {
    await expect(readPublicKey("")).rejects.toBeInstanceOf(PgpError);
  });
});

describe("extractFingerprint", () => {
  it("returns an uppercase hex string", () => {
    const fingerprint = extractFingerprint(testPublicKey);

    expect(fingerprint).toMatch(/^[0-9A-F]+$/);
  });

  it("returns a non-empty fingerprint for a valid key", () => {
    const fingerprint = extractFingerprint(testPublicKey);

    expect(fingerprint.length).toBeGreaterThan(0);
  });
});

describe("verifySignature", () => {
  it("returns valid=true and the original text for a correctly signed message", async () => {
    const result = await verifySignature({
      armoredSignedMessage,
      publicKey: testPublicKey
    });

    expect(result.valid).toBe(true);
    expect(result.text).toBe(TEST_MESSAGE_TEXT);
  });

  it("returns valid=false and empty text when armoredSignedMessage is garbage", async () => {
    const result = await verifySignature({
      armoredSignedMessage: GARBAGE_INPUT,
      publicKey: testPublicKey
    });

    expect(result.valid).toBe(false);
    expect(result.text).toBe("");
  });

  it("returns valid=false when the message is signed by a different key", async () => {
    const result = await verifySignature({
      armoredSignedMessage,
      publicKey: otherPublicKey
    });

    expect(result.valid).toBe(false);
    expect(result.text).toBe(TEST_MESSAGE_TEXT);
  });
});

describe("verifySignature — no signatures", () => {
  it("returns valid=false when the cleartext message has no embedded signatures", async () => {
    const unsignedMessage = await createCleartextMessage({ text: TEST_MESSAGE_TEXT });
    const armoredUnsigned = unsignedMessage.armor();

    const result = await verifySignature({
      armoredSignedMessage: armoredUnsigned,
      publicKey: testPublicKey
    });

    expect(result.valid).toBe(false);
  });
});
