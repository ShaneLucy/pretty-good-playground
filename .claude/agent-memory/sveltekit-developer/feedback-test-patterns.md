---
name: feedback-test-patterns
description: No mocks in tests — use real in-memory KV stubs; integrate real openpgp for key-dependent paths
metadata:
  type: feedback
---

Never use `vi.mock()` or `vi.fn()` for the KV layer. Instead, use a real `createInMemoryKv(store)` helper that wraps a `Map<string, string>` in the `KvStore` interface. This is what all existing server tests do.

**Why:** The project memory at `~/.claude/projects/.../memory/feedback-no-mocks-in-tests.md` records that mocks caused production divergence. Use real data and in-memory stubs throughout.

**How to apply:** For KV-dependent tests, always build a `Map<string, string>` and a `createInMemoryKv` wrapper. For openpgp-dependent tests (signature verification, key parsing), these are integration concerns — unit tests should stop at the validation layer just before openpgp is called (e.g., test that an invalid key string returns `fail(400, { field: "publicKey" })`).

Component tests (`test/lib/components/**`) currently fail with `document is not defined` — pre-existing test environment config issue unrelated to server-side work. Don't try to fix these unless explicitly asked; they require a jsdom or browser environment in vitest config.
