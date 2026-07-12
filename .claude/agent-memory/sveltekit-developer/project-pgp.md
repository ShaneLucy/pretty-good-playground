---
name: project-pgp
description: Core facts about the Pretty Good Playground SvelteKit app — adapter, KV, auth, route layout
metadata:
  type: project
---

**Adapter**: `@sveltejs/adapter-cloudflare`. Two KV namespaces: `MAIN_KV` (durable user/progress/flash) and `EPHEMERAL_KV` (short-lived challenges, rate-limit counters).

**Why:** Cloudflare Workers + KV for global edge deployment with no persistent server.

**How to apply:** Always import `getMainKv` and `getEphemeralKv` from `$lib/server/kv`. Never construct KV key strings manually — use the exported key builders (`userKey`, `progressKey`, `flashKey`, `challengeKey`, `pendingAuthKey`, `rateLimitKey`).

**Auth flow**: JWT in `session` HttpOnly cookie. Login is two-step: (1) paste public key → store `PendingAuthRecord` in `EPHEMERAL_KV` at `pendingAuthKey(fp)`, set `pending_fp` cookie; (2) sign nonce → verify signature → issue JWT via `signJwt`, set session cookie with `cookies.set()` (not `event.setHeaders`).

**Route structure** (as of Phase 5):
- `src/routes/+layout.server.ts` — surfaces `locals.user` + `locals.flash`
- `src/routes/(auth)/+layout.server.ts` — redirects to `/dashboard` if authenticated
- `src/routes/(auth)/register/` — public key + display name → user record in MAIN_KV
- `src/routes/(auth)/login/` — paste key → create pending auth in EPHEMERAL_KV
- `src/routes/(auth)/login/verify/` — sign nonce → verify → issue JWT
- `src/routes/logout/+server.ts` — GET deletes session cookie, redirects to `/`
- `src/hooks.server.ts` — JWT verification, flash read-and-clear, security headers

**Platform null guard**: In `hooks.server.ts`, when `platform` is falsy (local `vite dev`), skip JWT verification and set `locals.user = null`, `locals.flash = null`. Routes use `getMainKv(platform)` which falls back to an in-memory Map when `platform` is undefined.

**ActionData typing**: All `fail()` calls in a single action must include the same set of keys (even if `undefined`) so that svelte-check can infer a consistent `ActionData` union. E.g., field-less errors use `fail(429, { error: "...", field: undefined })`.
