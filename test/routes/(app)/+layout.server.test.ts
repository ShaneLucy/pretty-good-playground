import { describe, it, expect } from "vitest";
import { load } from "../../../src/routes/(app)/+layout.server";
import type { KvStore } from "$lib/server/kv";

const TEST_FINGERPRINT = "TESTFP";
const TEST_DISPLAY_NAME = "Test User";
const TEST_PUBLIC_KEY = "pk";
const LOGIN_PATH = "/login";

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

function makePlatform(mainKv: KvStore): App.Platform {
  return {
    env: {
      MAIN_KV: mainKv as unknown as App.Platform["env"]["MAIN_KV"],
      EPHEMERAL_KV: {} as App.Platform["env"]["EPHEMERAL_KV"],
      JWT_SECRET: "test-secret",
      CHALLENGE_PRIVATE_KEY: "",
      CHALLENGE_KEY_PASSPHRASE: ""
    },
    ctx: {} as App.Platform["ctx"],
    context: {} as App.Platform["context"],
    caches: {} as App.Platform["caches"]
  };
}

function makeLocals(fingerprint = TEST_FINGERPRINT, publicKey = TEST_PUBLIC_KEY): App.Locals {
  return {
    user: {
      fingerprint,
      displayName: TEST_DISPLAY_NAME,
      publicKey
    },
    flash: null
  };
}

async function captureRedirect(fn: () => unknown): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    if (typeof e === "object" && e !== null && "location" in e) {
      return (e as { location: string }).location;
    }
    return null;
  }
}

describe("(app) layout load", () => {
  it("redirects to /login when user is not authenticated", async () => {
    const kv = createInMemoryKv();
    const platform = makePlatform(kv);
    const unauthenticatedLocals = { user: null } as unknown as App.Locals;

    const location = await captureRedirect(() =>
      load({ locals: unauthenticatedLocals, platform } as unknown as Parameters<typeof load>[0])
    );

    expect(location).toBe(LOGIN_PATH);
  });

  it("returns the user from locals when authenticated", async () => {
    const kv = createInMemoryKv();
    const platform = makePlatform(kv);
    const locals = makeLocals();

    const result = await load({
      locals,
      platform
    } as unknown as Parameters<typeof load>[0]);

    expect(result).toEqual({ user: locals.user });
  });
});
