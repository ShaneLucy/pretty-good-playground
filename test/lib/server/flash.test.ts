import { describe, it, expect } from "vitest";
import type { KvStore } from "$lib/server/kv";
import { flashKey } from "$lib/server/kv";
import { writeFlash, readAndClearFlash } from "$lib/server/flash";
import type { FlashMessage } from "$lib/shared/types";

const TEST_FINGERPRINT = "ABCDEF1234567890";
const OTHER_FINGERPRINT = "FEDCBA0987654321";

const SUCCESS_FLASH: FlashMessage = { type: "success", message: "Operation completed." };
const ERROR_FLASH: FlashMessage = { type: "error", message: "Something went wrong." };

function createInMemoryKv(store = new Map<string, string>()): KvStore {
  return {
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, value);
    },
    delete: async (key) => {
      store.delete(key);
    }
  };
}

describe("writeFlash", () => {
  it("stores the message in KV under the flash key", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    await writeFlash(kv, TEST_FINGERPRINT, SUCCESS_FLASH);

    const stored = store.get(flashKey(TEST_FINGERPRINT));
    expect(stored).toBe(JSON.stringify(SUCCESS_FLASH));
  });

  it("stores the message with the correct flash key format", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);

    await writeFlash(kv, TEST_FINGERPRINT, ERROR_FLASH);

    expect(store.has(flashKey(TEST_FINGERPRINT))).toBe(true);
  });
});

describe("readAndClearFlash", () => {
  it("returns the stored FlashMessage when one exists", async () => {
    const kv = createInMemoryKv();
    await writeFlash(kv, TEST_FINGERPRINT, SUCCESS_FLASH);

    const result = await readAndClearFlash(kv, TEST_FINGERPRINT);

    expect(result).toEqual(SUCCESS_FLASH);
  });

  it("deletes the key after reading", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);
    await writeFlash(kv, TEST_FINGERPRINT, SUCCESS_FLASH);

    await readAndClearFlash(kv, TEST_FINGERPRINT);

    expect(store.has(flashKey(TEST_FINGERPRINT))).toBe(false);
  });

  it("returns null when the key is absent", async () => {
    const kv = createInMemoryKv();

    const result = await readAndClearFlash(kv, OTHER_FINGERPRINT);

    expect(result).toBeNull();
  });

  it("returns null when the stored value is malformed JSON", async () => {
    const store = new Map([[flashKey(TEST_FINGERPRINT), "not valid json {{{"]]);
    const kv = createInMemoryKv(store);

    const result = await readAndClearFlash(kv, TEST_FINGERPRINT);

    expect(result).toBeNull();
  });

  it("returns null when JSON does not match FlashMessage shape — missing type", async () => {
    const store = new Map([[flashKey(TEST_FINGERPRINT), JSON.stringify({ message: "oops" })]]);
    const kv = createInMemoryKv(store);

    const result = await readAndClearFlash(kv, TEST_FINGERPRINT);

    expect(result).toBeNull();
  });

  it("returns null when JSON does not match FlashMessage shape — missing message", async () => {
    const store = new Map([[flashKey(TEST_FINGERPRINT), JSON.stringify({ type: "success" })]]);
    const kv = createInMemoryKv(store);

    const result = await readAndClearFlash(kv, TEST_FINGERPRINT);

    expect(result).toBeNull();
  });
});
