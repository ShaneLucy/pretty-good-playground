---
name: feedback-no-mocks-in-tests
description: Never use vi.mock or vi.fn — use in-memory stubs that satisfy the KvStore interface
metadata:
  type: feedback
---

Never use `vi.mock` or `vi.fn` in this project's tests.

**Why:** Project convention enforces in-memory stubs instead of framework mocks for better fidelity and because the KvStore interface is simple enough to implement directly with a Map.

**How to apply:** Always create a `createInMemoryKv(store = new Map<string, string>())` helper in test files that returns a typed `KvStore` object. Pre-seed the store map when the test needs existing data. This pattern appears in `test/lib/server/progress.test.ts` and `test/routes/(app)/profile/+page.server.test.ts`.
