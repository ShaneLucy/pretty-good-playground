# Pretty Good Playground — Implementation Plan

A phased, dependency-ordered build plan. Each phase has a **Goal**, an ordered **Task list**, its hard **Depends on**, and **Done when** acceptance criteria.

This plan sequences the work only — it does not restate design or architecture. For the _what_ and _why_ of any item, read:

- `ARCHITECTURE.md` — tech stack, auth, KV schema, rate limiting, routes, content model, deployment. §11 is the "critical files" ordering this plan follows.
- `DESIGN.md` — design language, components (§8), screen specs (§4), gamification (§5), accessibility (§6).

## Current baseline

Base SvelteKit 5 (Runes) scaffold is in place with `vitest`, `eslint`, `prettier`. Not yet done: `adapter-auto` is still wired, and `openpgp`, `jose`, `@sveltejs/adapter-cloudflare`, `wrangler`, `@cloudflare/workers-types` are not installed. `src/lib/vitest-examples/` and `src/lib/index.ts` are scaffold cruft to delete as their areas are built.

## Agent ownership

Per `.claude/CLAUDE.md`, delegate each phase to the right specialist:

- **tech-lead-architect** — this plan; phase gates; the `wrangler.toml` / `app.d.ts` / CSP shape.
- **typescript-code-writer** — everything under `src/lib/server/**`, `src/lib/shared/**` (types, content, pure utils).
- **sveltekit-developer** — `hooks.server.ts`, all `+page.server.ts` / `+layout.server.ts` / `+server.ts`, load functions, form actions, and `.svelte` route files.
- **ux-design-accessibility** — design tokens, fonts, and all `src/lib/components/**`.

## Dependency map (phase level)

```
0 Deps ─▶ 1 Platform foundation ─▶ 2 Server library ─┬─▶ 5 Auth routes ─▶ 6 App routes ─▶ 8 Gamification ─▶ 9 Deploy
                                   3 Content + progress ┘        ▲                ▲
                        4 Design foundation ────────────────────┴────────────────┘  (also feeds 7)
                                                                                  7 Public routes ─▶ 9
```

Phases **2, 3, and 4** can run in parallel once Phase 1 lands (2 & 3 are TypeScript/server, 4 is pure frontend). Phase **7** (public routes) can run any time after Phase 4. Everything converges on Phase 5 → 6.

---

## Phase 0 — Dependencies & Tooling

**Goal:** Install runtime/dev packages and switch the build target to Cloudflare so nothing downstream is blocked on missing modules or the wrong adapter.

**Tasks:**

1. `bun add openpgp jose`
2. `bun add -D @sveltejs/adapter-cloudflare wrangler @cloudflare/workers-types`
3. Remove `@sveltejs/adapter-auto` from `package.json`.
4. Delete scaffold cruft: `src/lib/index.ts`, `src/lib/vitest-examples/`.

**Depends on:** nothing.

**Done when:** `bun install` is clean, `openpgp` + `jose` resolve, and `adapter-auto` is gone from the lockfile.

---

## Phase 1 — Platform Foundation (critical files, part A)

**Goal:** Establish the type and config bedrock every server module and route imports. This is ARCHITECTURE §11 items 1–3 plus the shared type surface (§11 item 10).

**Tasks (in order):**

1. `src/app.d.ts` — declare `App.Locals` (`user`, `flash`), `App.PageData`, `App.Platform.env` (both KV bindings + secrets). Copy the exact shape from ARCHITECTURE §9. **Everything depends on this.**
2. `vite.config.ts` — swap `adapter-auto` → `@sveltejs/adapter-cloudflare`.
3. `wrangler.toml` — `nodejs_compat`, both KV namespace bindings (placeholder ids), `[vars]`, secret names as comments. From ARCHITECTURE §9.
4. `src/lib/shared/types.ts` — all shared interfaces: `ChallengeType`, `ChallengeSetup`, `Challenge`, `Lesson`, `Chapter`, plus `UserRecord`, `ProgressRecord`, `FlashMessage`. Follow the TS standards in `.claude/skills/typescript.md`: discriminated union for `ChallengeType`, `readonly` on content shapes, `as const` where applicable, no `any`.

**Depends on:** Phase 0.

**Done when:** `bun run check` passes with the new `app.d.ts` and `types.ts`, and `vite build` selects the Cloudflare adapter.

> **Hard gate:** Phases 2, 3, and 4 cannot start until `src/app.d.ts` and `src/lib/shared/types.ts` are complete — they are the contract every module below imports.

---

## Phase 2 — Server Library (critical files, part B)

**Goal:** Build the server-only primitives that auth, rate limiting, sessions, and flash messaging all sit on. Nothing here touches the client bundle. ARCHITECTURE §11 items 4–9.

**Tasks (in order — later items import earlier ones):**

1. `src/lib/server/kv.ts` — typed get/put/delete helpers over `MAIN_KV` / `EPHEMERAL_KV`, with the in-memory `Map` fallback when `platform == null` (vite dev). All key builders (`user:v1:`, `progress:v1:`, `flash:v1:`, `challenge:v1:`, `rl:v1:`) live here as pure functions.
2. `src/lib/server/pgp.ts` — `readKey()`, fingerprint extraction, `verifySignature()`. **Server-only** — must never appear in a client import graph (ARCHITECTURE §7).
3. `src/lib/server/auth.ts` — JWT sign/verify (`jose`), session cookie builder (30-day vs session per "Remember this device"), `pending_fp` cookie helpers.
4. `src/lib/server/rate-limit.ts` — `rateLimit(kv, endpoint, identifier, limit)` dual-bucket sliding window (ARCHITECTURE §4). Race conditions are acceptable.
5. `src/lib/server/flash.ts` — write/read-and-delete `flash:v1:{fingerprint}`.
6. `src/hooks.server.ts` — JWT → `locals.user`; read+clear flash → `locals.flash`; attach the full security-header/CSP block from ARCHITECTURE §9 to every response.

**Depends on:** Phase 1 (`app.d.ts`, `types.ts`).

**Done when:** unit tests pass for `rate-limit` (window boundary math), `pgp` (valid/invalid key + good/bad signature), and `auth` (sign→verify round-trip, tamper rejection). Tests follow AAA + typed mocks per the TS skill. A `curl -I` in `wrangler dev` shows the CSP and security headers.

> **Security check for this phase:** confirm `openpgp` is imported only under `src/lib/server/**`. A build that pulls `openpgp` into a client chunk is a failing gate.

---

## Phase 3 — Content Model & Progress Engine

**Goal:** The bundled curriculum plus the pure functions that turn a stored `ProgressRecord` into derived UI state (unlocked chapters, %, streak, level, achievements).

**Tasks:**

1. `src/lib/shared/content/chapter-1.ts` … `chapter-5.ts` — author the 5 chapters / 20 lessons from ARCHITECTURE §6. **Content IDs (`ch1-l2-c1`) are permanent — never rename.** Quiz `correctOption` and `expectedPlaintext` live here but must be stripped before reaching `PageData`.
2. `src/lib/shared/content/index.ts` — typed `chapters` array (`satisfies readonly Chapter[]`). The only sanctioned barrel in the project (stable public API).
3. `src/lib/shared/progress-utils.ts` — pure functions: `deriveUnlockedChapters()`, `chapterPercent()`, `currentLesson()`, `levelFromXp()`, `streakStatus()`. No I/O. Fully unit-testable.
4. `src/lib/server/progress.ts` — read/write `progress:v1:{fingerprint}`; append-only completion with duplicate guards (no double-XP); XP award + achievement detection (ARCHITECTURE §6, DESIGN §5). Server-only.

**Depends on:** Phase 1 (types); task 4 also depends on Phase 2 `kv.ts`.

**Done when:** `progress-utils` has full unit coverage (level thresholds, unlock chains, streak reset on >1-day gap, chapter/perfect/no-hint bonuses). `progress.ts` proven idempotent — resubmitting a completed challenge awards zero additional XP.

---

## Phase 4 — Design Foundation

**Goal:** Tokens, self-hosted fonts, and the primitive components so route work in Phases 5–7 composes rather than styles from scratch. Pure frontend — parallelisable with Phases 2–3.

**Tasks:**

1. Global CSS: color tokens, type scale, spacing, radius, shadows, motion, and `prefers-color-scheme` dark mode (DESIGN §1). Include the `prefers-reduced-motion` reset and the visible focus-ring rule (DESIGN §6).
2. Self-host Plus Jakarta Sans, Inter, JetBrains Mono under `static/fonts/` with `@font-face` served from `'self'` (satisfies CSP, no third-party requests). Use `font-display: swap` + `size-adjust` to avoid CLS; `preload` the two above-the-fold faces (per `.claude/skills/web-optimization.md`).
3. Primitive UI components (DESIGN §8): `ui/Button`, `ui/InfoBox`, `ui/CopyBlock`, `ui/MonoTextarea`, `ui/TextInput`, `ui/ProgressBar` (CSS-styled native `<progress>`), `ui/Details`.
4. Layout components: `layout/AppHeader` (3 variants), `layout/FlashBanner` (4 variants, `role="status"`/`alert`), `layout/Footer`, `layout/PageContainer`, `layout/BottomTabBar`.
5. `svelte-autofixer` run to zero issues on every component before it is considered done (per project CLAUDE.md).

**Depends on:** Phase 1 (types, for typed props). No dependency on 2/3.

**Done when:** components render in isolation, meet WCAG AA contrast (DESIGN §6), are keyboard-operable, and carry no required-JS behaviour (JS only enhances). Fonts load from `'self'` with no layout shift.

---

## Phase 5 — Root Layout & Auth Flow Routes

**Goal:** A user can register, log in via the two-step PGP challenge, and log out — **with JavaScript disabled**. This is the first end-to-end vertical slice.

**Tasks (in order):**

1. `src/routes/+layout.server.ts` — surface `locals.user` + read-and-clear flash → `PageData`.
2. `src/routes/+layout.svelte` — app shell: `AppHeader` + `FlashBanner` + slot + `Footer`.
3. `src/routes/(auth)/+layout.server.ts` — if `locals.user`, `redirect(303, '/dashboard')`.
4. `src/routes/(auth)/register/` — `+page.svelte` (key + display-name form) and `+page.server.ts` (`registerAction`: rate-limit → parse key → store `user` + empty `progress` → redirect to `/login` with flash). Inline validation errors per DESIGN §4 Screen 3.
5. `src/routes/(auth)/login/` — `+page.svelte` (key form + "Remember this device") and `+page.server.ts` (`step1Action`: rate-limit → lookup user → generate nonce → store `challenge` + `pending_auth` → set `pending_fp` cookie → redirect to `/login/verify`).
6. `src/routes/(auth)/login/verify/` — `+page.svelte` (nonce display, signing instructions in `<details>`, paste form) and `+page.server.ts` (`load`: read pending challenge or redirect to `/login`; `step2Action`: rate-limit → fetch+**delete** nonce → `openpgp.verify` → issue JWT + session cookie → redirect to `/dashboard`).
7. `src/routes/logout/+server.ts` — GET clears session cookie → `redirect(303, '/')`.
8. Progressive enhancement pass: add `use:enhance` to all three forms for inline errors without reload. Baseline must already work without it.

**Depends on:** Phase 2 (`auth`, `pgp`, `rate-limit`, `flash`, `hooks`), Phase 3 `progress.ts` (empty record on register), Phase 4 (shell + form components).

**Done when:** full register → login → verify → dashboard-redirect → logout cycle works with **JS off**; replay of a consumed nonce is rejected; rate limits trigger the copy in DESIGN §4; wrong-key signature returns the exact error string from DESIGN §7.

---

## Phase 6 — Authenticated App Routes

**Goal:** The core learning loop: dashboard course map, lesson pages with per-type workspaces and server-graded submission, profile, and key management.

**Tasks:**

1. `src/routes/(app)/+layout.server.ts` — if `!locals.user`, `redirect(303, '/login')`.
2. Tutorial components (DESIGN §8): `tutorial/ChapterCard`, `tutorial/LessonList`/`LessonCard`, `tutorial/XPDisplay`, `tutorial/LevelBadge`, `tutorial/FingerprintDisplay`, `tutorial/BreadcrumbTrail`, `tutorial/LessonProgressBar`, `tutorial/FeedbackPanel`.
3. `src/routes/(app)/dashboard/` — `load()` reads progress, derives unlock state via `progress-utils`; `+page.svelte` renders the course map + stats sidebar + "Continue where you left off" (DESIGN §4 Screen 6).
4. `src/routes/(app)/learn/+layout.svelte` — tutorial chrome (breadcrumb, progress).
5. `src/routes/(app)/learn/[chapterId]/` — `load()` verifies the chapter is unlocked (else redirect); `+page.svelte` chapter overview + lesson list.
6. `src/routes/(app)/learn/[chapterId]/[lessonId]/` — the workspace components (`SignWorkspace`, `VerifyWorkspace`, `EncryptWorkspace`, `DecryptWorkspace`, `QuizWorkspace`, `ExplainerWorkspace`), the mobile `:target` tab layout (DESIGN §9), and `+page.server.ts` (`load`: lesson + progress, **strip correct answers**; `submit` action: rate-limit → grade server-side → update progress → write flash if achievement → redirect with `lastResult`).
7. `src/routes/(app)/profile/` — `load()` user + progress; achievements grid, chapter summary, display-name edit action, public/private visibility toggle action (DESIGN §4 Screen 8).
8. `src/routes/(app)/keys/` — key display + download `.asc`; `deregister` action gated on typing `DEREGISTER` (DESIGN §4 Screen 9).
9. Progressive enhancement: `use:enhance` on the submit form for inline `FeedbackPanel` without reload; copy buttons on `CopyBlock`.

**Depends on:** Phase 3 (content + progress + utils), Phase 5 (auth + shell), Phase 4 (primitives).

**Done when:** a logged-in user completes a lesson of every `ChallengeType` with **JS off**, XP/level/unlocks update correctly, quiz answers are provably absent from `PageData`, chapter-locked URLs redirect, and deregister requires the exact confirmation token.

---

## Phase 7 — Public / Marketing Routes

**Goal:** The unauthenticated surface that frames the product and onboards new users. Independent of the auth loop — can run any time after Phase 4.

**Tasks:**

1. `src/routes/+page.svelte` — landing page: hero, trust signals, chapter preview, "how it works", footer (DESIGN §4 Screen 1).
2. `src/routes/resources/+page.svelte` — PGP tools by platform (DESIGN §4 Screen 2).
3. `src/routes/about/+page.svelte` and `src/routes/lost-my-key/+page.svelte` (DESIGN §3 Journey 3).
4. `src/routes/profile/[fingerprint]/` — public profile: `load()` returns the record only if the user opted in, else 404.

**Depends on:** Phase 4 (design foundation). Public profile also needs Phase 3 `progress.ts` + Phase 6's visibility flag.

**Done when:** all public pages render server-side, pass the perf/a11y budget below, and the public profile respects the opt-in flag (private → 404).

---

## Phase 8 — Gamification Wiring & Progressive-Enhancement Polish

**Goal:** Tie the XP/level/achievement/streak/flash systems together across the app and layer on the JS niceties. Most engine logic already lives in Phase 3 `progress.ts`; this phase is the cross-cutting UI wiring and enhancement layer.

**Tasks:**

1. Verify every XP rule, level threshold, and the full achievement set (learning/skill/community/hidden, incl. `night_owl`, `persistence`, `paranoid_compliment`) from DESIGN §5 fire correctly end-to-end.
2. Flash-banner achievement notifications on the next load (no-JS baseline) + JS toast auto-dismiss (4s).
3. Hint `<details>` with hidden-input tracking so hint usage is deducted at submit; no server round-trip to open a hint.
4. Enhancement pass across the app: animated XP fill, inline feedback, JS-managed mobile tabs with `aria-selected`, copy buttons, display-name inline edit.
5. `<abbr>` glossary terms; `role="status"` on feedback regions; `aria-current="step"` on the login step indicator (DESIGN §6).

**Depends on:** Phases 6 and 7.

**Done when:** every achievement in DESIGN §5 is earnable; the entire app still works with **JS off**; enabling JS only removes reloads and adds comfort — never unlocks a flow.

---

## Phase 9 — Deployment, Hardening & Performance Gate

**Goal:** Ship to Cloudflare with real bindings and secrets, and enforce the performance/accessibility/security budgets before launch.

**Tasks:**

1. Provision the two KV namespaces (prod + preview) via `wrangler`; fill the real ids in `wrangler.toml`.
2. Generate the challenge service keypair. Set secrets: `wrangler secret put JWT_SECRET`, `CHALLENGE_PRIVATE_KEY`, `CHALLENGE_KEY_PASSPHRASE`. Embed the challenge **public** key in the relevant Chapter 3 challenge `setup.recipientPublicKey`.
3. Verify the CSP/security headers on deployed responses; confirm no third-party requests (fonts self-hosted, no analytics).
4. Performance gate (`.claude/skills/web-optimization.md`): LCP < 2.5s, CLS < 0.1 (fonts must not shift), TTFB < 600ms (Worker SSR at edge), per-route JS < 150kB compressed. Confirm `openpgp` is **not** in any client chunk.
5. Free-tier note (ARCHITECTURE §9): if KV read volume becomes a concern, cache progress in the session cookie (one read at login instead of per page view) — defer unless measured.

**Depends on:** Phases 5–8 (a working app to deploy).

**Done when:** the app runs on `*.workers.dev`, every core flow works with JS disabled in a real browser, secrets are set (never committed), and all four budgets in task 4 pass.

---

## Cross-cutting invariants (every phase must uphold)

- **Private-key boundary:** the server never receives, stores, or handles a user private key. `openpgp` server-only.
- **No-JS-first:** every core flow works with JS off; `use:enhance` is additive, never load-bearing.
- **Permanent content IDs:** never rename/delete lesson or challenge IDs — they live in users' KV progress.
- **Answers stay server-side:** quiz `correctOption` / expected plaintext are stripped from `PageData`.
- **TypeScript standards:** no `any`, discriminated unions for state, explicit return types, typed errors — per `.claude/skills/typescript.md`.
- **Accessibility:** WCAG AA contrast, visible focus rings, `prefers-reduced-motion`, labelled inputs — per DESIGN §6.
