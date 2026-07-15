import { describe, it, expect, vi, beforeEach } from "vitest";
import type { KvStore } from "$lib/server/kv";
import { rateLimitKey } from "$lib/server/kv";
import { rateLimit } from "$lib/server/rate-limit";

const TEST_CLIENT = "test-client-id";

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

describe("rateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests below the limit", async () => {
    const kv = createInMemoryKv();
    const result = await rateLimit(kv, "login", TEST_CLIENT, 10);
    expect(result.allowed).toBe(true);
  });

  it("increments counter on allowed request", async () => {
    const store = new Map<string, string>();
    const kv = createInMemoryKv(store);
    await rateLimit(kv, "login", "user", 10);
    const minute = Math.floor(Date.now() / 60_000);
    expect(store.get(`rl:v1:login:user:${minute}`)).toBe("1");
  });

  it("rejects when current count reaches limit", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    const store = new Map([[`rl:v1:login:${TEST_CLIENT}:${minute}`, "10"]]);
    const kv = createInMemoryKv(store);
    const result = await rateLimit(kv, "login", TEST_CLIENT, 10);
    expect(result.allowed).toBe(false);
  });

  it("counts previous minute at full weight when elapsed ≈ 0", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    vi.spyOn(Date, "now").mockReturnValue(minute * 60_000); // elapsed = 0

    const store = new Map([[`rl:v1:ep:id:${minute - 1}`, "5"]]);
    const kv = createInMemoryKv(store);
    // prevCount=5 * (1-0) + currCount=0 = 5 ≥ limit 5 → rejected
    const result = await rateLimit(kv, "ep", "id", 5);
    expect(result.allowed).toBe(false);
  });

  it("discounts previous minute at elapsed ≈ 1", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    vi.spyOn(Date, "now").mockReturnValue(minute * 60_000 + 59_999); // elapsed ≈ 1

    const store = new Map([[`rl:v1:ep:id:${minute - 1}`, "100"]]);
    const kv = createInMemoryKv(store);
    // prevCount=100 * (1-0.9999...) ≈ 0.001 + currCount=0 < limit 5 → allowed
    const result = await rateLimit(kv, "ep", "id", 5);
    expect(result.allowed).toBe(true);
  });
});

describe("rateLimit — non-numeric KV values", () => {
  const NON_NUMERIC_VALUE = "abc";
  const HIGH_LIMIT = 10;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("treats non-numeric previous-minute value as 0 and allows the request", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    const store = new Map([[rateLimitKey("login", TEST_CLIENT, minute - 1), NON_NUMERIC_VALUE]]);
    const kv = createInMemoryKv(store);

    const result = await rateLimit(kv, "login", TEST_CLIENT, HIGH_LIMIT);

    expect(result.allowed).toBe(true);
  });

  it("treats non-numeric current-minute value as 0 and allows the request", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    const store = new Map([[rateLimitKey("login", TEST_CLIENT, minute), NON_NUMERIC_VALUE]]);
    const kv = createInMemoryKv(store);

    const result = await rateLimit(kv, "login", TEST_CLIENT, HIGH_LIMIT);

    expect(result.allowed).toBe(true);
  });

  it("increments counter to 1 when current-minute value is non-numeric", async () => {
    const minute = Math.floor(Date.now() / 60_000);
    const store = new Map([[rateLimitKey("login", TEST_CLIENT, minute), NON_NUMERIC_VALUE]]);
    const kv = createInMemoryKv(store);

    await rateLimit(kv, "login", TEST_CLIENT, HIGH_LIMIT);

    expect(store.get(rateLimitKey("login", TEST_CLIENT, minute))).toBe("1");
  });
});
