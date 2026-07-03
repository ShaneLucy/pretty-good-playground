# Pretty Good Playground — Architecture Plan

---

## Core Constraints

Before anything else, two constraints shape every decision:

1. **The private key boundary**: The server never sees, stores, or handles any user's private key. The server holds only public keys and verifies signatures. All private-key operations (signing, decrypting) are performed by the user with their own PGP tool (GPG, Kleopatra, OpenKeychain, etc.) outside the browser, and the output is pasted into the app.

2. **JavaScript is optional**: Every core user flow — registration, authentication, completing lessons, submitting answers — must work with JavaScript entirely disabled. JavaScript is a progressive enhancement layer only. This is both a resilience principle and an ideological alignment with the privacy ethos of the app.

---

## 1. System Overview

A single SvelteKit 5 app deployed as a Cloudflare Worker. The Worker serves server-side rendered HTML pages. All persistent state lives in Cloudflare KV. There are no external services, no email providers, no analytics beacons, no client-side scripts required for any core functionality.

**The no-JS-first architecture maps naturally to SvelteKit's built-in primitives:**

- Data loading → `+page.server.ts` `load()` functions
- Mutations (auth, progress) → SvelteKit form **actions** on `+page.server.ts`
- Navigation → standard `<a>` links and `<form>` submissions
- Flash messages (achievements, feedback) → short-lived KV records read on the next page load

`use:enhance` from `@sveltejs/kit` is added on top of forms as a progressive enhancement — it intercepts submissions and avoids full page reloads when JS is available, but forms fall back to native browser behaviour without it. No JS-only flow is ever introduced for a core user task.

**Package additions required:**

```
bun add openpgp jose
bun add -D @sveltejs/adapter-cloudflare wrangler @cloudflare/workers-types
```

`adapter-auto` in `vite.config.ts` is replaced with `@sveltejs/adapter-cloudflare`.

---

## 2. Auth System Design

### Identity Model

A user's identity is their OpenPGP public key fingerprint — 40 hex characters. No username, email address, or password is involved. The fingerprint is the primary key for all KV lookups.

**Why the challenge/response is secure:** Having someone's public key gives an attacker zero ability to impersonate them. The public key can *verify* signatures but cannot *create* them. Only the holder of the corresponding private key can produce a valid signature over the server's nonce. The attack "submit Alice's public key and log in as Alice" fails at the signing step — the attacker cannot sign the nonce without Alice's private key.

### No In-App Key Generation

The app does not generate PGP keys for users. Users must already have an OpenPGP keypair, generated with their own tools. The `/resources` page provides links to:

- **Linux/macOS/Windows**: GPG (`gpg --gen-key`)
- **macOS GUI**: GPG Suite
- **Windows GUI**: Kleopatra / Gpg4win
- **Android**: OpenKeychain
- **iOS**: PGP Everywhere / iPGMail

### Registration Flow (no JS required)

1. User navigates to `/register`
2. Page renders a `<form>` with a `<textarea>` for their armored public key and a display name input
3. User submits (native form POST)
4. Form action on `+page.server.ts`:
   - Rate-limits by IP
   - Parses the key with `openpgp.readKey()`
   - Extracts the fingerprint
   - Stores user record in `MAIN_KV` under `user:v1:{fingerprint}`
   - Stores an empty progress record under `progress:v1:{fingerprint}`
   - Redirects to `/login` with a flash message: "Registration complete — sign in to continue"
5. If key is invalid, action returns `fail(400, { error: '...' })` and the page re-renders with the error inline

### Login Flow (no JS required)

**Step 1 — Identify** (`/login`)

1. Page renders a `<form>` with a `<textarea>` for the armored public key
2. User submits
3. Form action:
   - Rate-limits by IP
   - Parses the key, extracts fingerprint
   - Looks up `user:v1:{fingerprint}` in `MAIN_KV` — returns `fail(400)` with "No account found for this key" if missing
   - Generates 32 random bytes nonce via `crypto.getRandomValues()`
   - Stores `challenge:v1:{fingerprint}:{nonce_hex}` in `EPHEMERAL_KV` with 300s TTL
   - Stores `pending_auth:{fingerprint}` in `EPHEMERAL_KV` with 300s TTL (so step 2 knows whose challenge to verify)
   - Sets a `pending_fp` short-lived cookie (5 min, HttpOnly) containing the fingerprint
   - `redirect(303, '/login/verify')`

**Step 2 — Sign and verify** (`/login/verify`)

1. `load()` reads the `pending_fp` cookie, looks up the pending challenge in KV, returns the nonce to display
2. If no pending challenge exists (expired or missing), redirects back to `/login`
3. Page renders:
   - The nonce displayed in a `<pre>` block with a "Select all" instruction (copy button added via JS as enhancement)
   - Instructions for signing: platform-specific commands in a `<details><summary>How do I sign this?</summary>...</details>` block
   - A `<form>` with a `<textarea>` to paste the signed output
4. User signs the nonce with their PGP tool, pastes the armored signed message, submits
5. Form action:
   - Rate-limits by IP
   - Reads `pending_fp` cookie to get the fingerprint
   - Fetches the stored public key from `MAIN_KV`
   - Fetches and **deletes** the nonce from `EPHEMERAL_KV` (prevents replay — the nonce is consumed on first use)
   - Calls `openpgp.verify()` to validate the signature
   - On failure: returns `fail(401)` with specific error message, page re-renders
   - On success: signs a JWT (`jose`, 30-day expiry, subject = fingerprint), sets `session` cookie (`HttpOnly; Secure; SameSite=Strict; Path=/`), clears `pending_fp` cookie, `redirect(303, '/dashboard')`

### Session Management

Sessions are stateless JWTs. Payload: `{ sub: fingerprint }` plus standard claims. The `JWT_SECRET` Cloudflare secret is never in version control.

`hooks.server.ts` verifies the JWT on every request and populates `event.locals.user`. Failed verification clears the cookie and sets `locals.user = null`.

**Session duration: 30 days.** Re-authentication requires the user to fire up their PGP tool, sign a challenge, and paste the result — a significant UX burden. 30 days is pragmatic. The `HttpOnly; SameSite=Strict` cookie combined with the strict CSP limits the realistic theft surface to XSS (mitigated by CSP) and physical device access.

The login form includes a "Remember this device" checkbox, checked by default:
- Checked → 30-day cookie
- Unchecked → session cookie (cleared when browser closes)

### No Account Recovery

There is no recovery mechanism. This is intentional and becomes teaching content in Chapter 5 (private key backups). The `/register` page makes this explicit upfront. Users who lose their key start fresh with a new account — their old progress is not recoverable.

---

## 3. KV Namespace Schema

Two namespaces: `MAIN_KV` (permanent) and `EPHEMERAL_KV` (short-lived). All keys versioned with `v1:` for future schema migration safety.

### MAIN_KV

**User identity:** `user:v1:{fingerprint}` — TTL: none

```jsonc
{
  "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n...",
  "registeredAt": "2025-01-15T10:00:00.000Z",
  "displayName": "Alice"     // user-chosen at registration, non-unique
}
```

Display names are non-unique. The fingerprint is the canonical identity. Public profiles are at `/profile/{fingerprint-short}`, not `/profile/{displayName}`.

**User progress:** `progress:v1:{fingerprint}` — TTL: none

```jsonc
{
  "completedLessons": ["ch1-l1", "ch1-l2"],
  "completedChallenges": ["ch1-l1-c1", "ch1-l2-c1"],
  "xp": 420,
  "achievements": ["first_lesson", "chapter_1_complete"],
  "lastActive": "2025-07-01T14:23:00.000Z",
  "streakDays": 3,
  "streakLastDate": "2025-07-01"
}
```

`completedLessons` and `completedChallenges` are append-only. The server checks for duplicates before appending to prevent double-XP exploits. All derived state (unlocked chapters, % complete, current lesson) is computed at read time via pure functions — never stored.

**Flash messages:** `flash:v1:{fingerprint}` — TTL: 60s

```jsonc
{
  "type": "achievement" | "success" | "error" | "info",
  "title": "Achievement Unlocked: First Lesson",
  "body": "You completed your first lesson."
}
```

Written by form actions when something noteworthy happens (achievement earned, chapter complete). Read and deleted by the root `load()` function on the next page visit. Renders as a server-side banner — no JS required.

### EPHEMERAL_KV

**Auth challenge nonces:** `challenge:v1:{fingerprint}:{nonce_hex}` — TTL: 300s

```jsonc
{ "createdAt": "2025-07-01T14:23:00.000Z", "ip": "1.2.3.4" }
```

The nonce is embedded in the key — existence is proof of validity. Explicitly deleted on successful verification; TTL is a safety net for abandoned challenges.

**Pending auth state:** `pending_auth:v1:{fingerprint}` — TTL: 300s

```jsonc
{ "step": 2, "createdAt": "2025-07-01T14:23:00.000Z" }
```

Used to validate that step 2 of login (`/login/verify`) is reached legitimately from step 1.

**Rate limit buckets:** `rl:v1:{endpoint_slug}:{identifier}:{unix_minute}` — TTL: 120s

Value is a plain decimal string (e.g. `"7"`). `{identifier}` is the client IP for unauthenticated endpoints, the fingerprint for authenticated ones.

---

## 4. Rate Limiting Strategy

**Approach: KV-based dual-bucket sliding window.** Chosen over Cloudflare Rulesets because it can distinguish per-fingerprint limits and be programmed in TypeScript.

**Algorithm:**

```
minute = floor(Date.now() / 60_000)
[prevCount, currCount] = await Promise.all([
  kv.get(`rl:v1:${endpoint}:${id}:${minute - 1}`),
  kv.get(`rl:v1:${endpoint}:${id}:${minute}`)
])
elapsed = (Date.now() % 60_000) / 60_000
estimate = (prevCount ?? 0) * (1 - elapsed) + (currCount ?? 0)
if (estimate >= limit) return { allowed: false }
await kv.put(`rl:v1:${endpoint}:${id}:${minute}`, String((currCount ?? 0) + 1), { expirationTtl: 120 })
return { allowed: true }
```

Race conditions are acceptable — rate limiting is best-effort, not a hard guarantee.

**Per-endpoint limits:**

| Endpoint / Action | Identifier | Limit | Window |
|---|---|---|---|
| Login step 1 form action | IP | 10 | 1 min |
| Login step 2 form action | IP | 10 | 1 min |
| Register form action | IP | 5 | 1 min |
| Challenge submit form action | Fingerprint | 30 | 1 min |

**Implementation:** `src/lib/server/rate-limit.ts` exports `rateLimit(kv, endpoint, identifier, limit)`. Called at the top of each form action before any business logic.

---

## 5. SvelteKit Route Structure

The primary architectural shift from a typical SPA design: **mutations happen via SvelteKit form actions, not fetch-to-JSON-API endpoints.** This enables no-JS operation. `use:enhance` is layered on top when JS is available to avoid full page reloads, but is never required.

```
src/
├── app.d.ts                              # App.Locals, App.Platform, App.PageData types
├── app.html                              # HTML shell; no inline scripts
├── hooks.server.ts                       # JWT → locals.user; CSP and security headers
│
├── lib/
│   ├── server/                           # Never included in the client bundle
│   │   ├── kv.ts                         # Typed KV helpers; in-memory Map fallback for vite dev
│   │   ├── auth.ts                       # JWT sign/verify; session cookie builder
│   │   ├── pgp.ts                        # openpgp.readKey(), verify(), fingerprint extraction
│   │   ├── rate-limit.ts                 # Dual-bucket sliding window
│   │   ├── progress.ts                   # Read/write progress; achievement detection
│   │   └── flash.ts                      # Write and read flash messages from KV
│   │
│   ├── shared/
│   │   ├── types.ts                      # All shared TypeScript interfaces
│   │   ├── content/
│   │   │   ├── index.ts                  # Re-exports all chapters as typed array
│   │   │   ├── chapter-1.ts
│   │   │   ├── chapter-2.ts
│   │   │   ├── chapter-3.ts
│   │   │   ├── chapter-4.ts
│   │   │   └── chapter-5.ts
│   │   └── progress-utils.ts             # Pure functions: deriveUnlockedChapters(), etc.
│   │
│   └── components/
│       ├── layout/
│       │   ├── AppHeader.svelte
│       │   ├── FlashBanner.svelte        # Renders flash messages from server; no JS needed
│       │   └── Footer.svelte
│       ├── tutorial/
│       │   ├── ChapterCard.svelte
│       │   ├── LessonList.svelte
│       │   ├── XPDisplay.svelte          # Static display; no JS needed
│       │   └── ProgressBar.svelte        # CSS-only <progress> element
│       └── ui/
│           ├── Button.svelte
│           ├── CodeBlock.svelte          # <pre><code> with optional JS copy button
│           ├── Details.svelte            # Wrapper for <details>/<summary> pattern
│           └── InfoBox.svelte
│
└── routes/
    ├── +layout.svelte                    # App shell: header (with flash banner), footer, slot
    ├── +layout.server.ts                 # Verify JWT → user in locals; read + clear flash from KV
    ├── +page.svelte                      # Landing page (static; no auth required)
    │
    ├── resources/
    │   └── +page.svelte                  # PGP tool links by platform; no auth required
    │
    ├── (auth)/                           # Route group: redirect to /dashboard if already logged in
    │   ├── +layout.server.ts             # if locals.user → redirect(303, '/dashboard')
    │   ├── login/
    │   │   ├── +page.svelte              # Step 1: paste public key form
    │   │   └── +page.server.ts           # load(): nothing; actions: { default: step1Action }
    │   ├── login/verify/
    │   │   ├── +page.svelte              # Step 2: displays nonce, paste signed output form
    │   │   └── +page.server.ts           # load(): read pending challenge; actions: { default: step2Action }
    │   └── register/
    │       ├── +page.svelte              # Paste public key + choose display name form
    │       └── +page.server.ts           # actions: { default: registerAction }
    │
    ├── (app)/                            # Route group: all routes require auth
    │   ├── +layout.server.ts             # if !locals.user → redirect(303, '/login')
    │   ├── dashboard/
    │   │   ├── +page.svelte              # Chapter map; XP summary
    │   │   └── +page.server.ts           # load(): progress from KV; derive unlock state
    │   ├── profile/
    │   │   ├── +page.svelte              # Fingerprint, display name, achievements
    │   │   └── +page.server.ts           # load(): user record + progress
    │   ├── keys/
    │   │   ├── +page.svelte              # Public key display; deregister danger zone
    │   │   └── +page.server.ts           # load(): user record; actions: { deregister }
    │   └── learn/
    │       ├── +layout.svelte            # Tutorial chrome: breadcrumb, lesson progress bar
    │       └── [chapterId]/
    │           ├── +page.svelte          # Chapter overview; lesson list
    │           ├── +page.server.ts       # load(): verify chapter unlocked; chapter content + progress
    │           └── [lessonId]/
    │               ├── +page.svelte      # Lesson content + challenge workspace (a <form>)
    │               └── +page.server.ts   # load(): lesson + progress; actions: { submit }
    │
    ├── profile/[fingerprint]/
    │   └── +page.svelte                  # Public-facing profile (no auth required to view)
    │   └── +page.server.ts               # load(): user record if public; 404 if private
    │
    └── logout/
        └── +server.ts                    # GET: clear session cookie → redirect(303, '/')
```

### Form action pattern for lesson challenge submission

```
POST /learn/[chapterId]/[lessonId]
  → rate limit (fingerprint)
  → validate answer server-side
  → if correct: update progress in KV, check achievements, write flash if achievement
  → redirect(303, same page or next lesson URL)
  → on next load: page shows updated progress; flash banner shows achievement if earned
```

The `<form>` on the lesson page has a single `<textarea>` for the user to paste their PGP output and a submit button. No JavaScript needed. With JS available, `use:enhance` prevents full-page reload and shows inline feedback.

---

## 6. Tutorial Content Model

### Static TypeScript files, not KV

Content lives in `src/lib/shared/content/*.ts`, bundled at build time. Never stored in KV. Rationale: content is identical for all users, changes only on deploys, fits within the Worker bundle limit, and is easy to review in version control.

**Content IDs are permanent.** Lesson and challenge IDs (e.g. `ch1-l2-c1`) are stored in users' progress records in KV. They must never be renamed or deleted — doing so silently breaks progress for existing users. If restructuring is needed, add new IDs rather than changing old ones.

### Type Definitions (`src/lib/shared/types.ts`)

```typescript
type ChallengeType =
  | 'explainer'           // Read content and mark done; no answer needed
  | 'quiz'                // Multiple-choice; correct answer lives server-side only
  | 'sign-message'        // User signs provided plaintext with their tool, pastes result
  | 'verify-signature'    // User verifies provided signed message, pastes extracted text
  | 'encrypt-message'     // User encrypts to challenge keypair's public key, pastes ciphertext
  | 'decrypt-message'     // User decrypts server-encrypted ciphertext, pastes plaintext
  | 'sign-key';           // User signs another key (web of trust exercise)

interface ChallengeSetup {
  recipientPublicKey?: string;   // Armored public key for encrypt-message tasks
  ciphertextToDecrypt?: string;  // Armored ciphertext for decrypt-message tasks
  signatureToVerify?: string;    // Armored signed message for verify tasks
  plaintextToSign?: string;      // Plaintext to sign for sign-message tasks
  signerPublicKey?: string;      // Public key to verify against for verify tasks
}

interface Challenge {
  id: string;                    // Globally unique, stable forever: 'ch1-l2-c1'
  type: ChallengeType;
  prompt: string;
  setup?: ChallengeSetup;
  quizOptions?: string[];        // Only for 'quiz' type
  xpReward: number;
  hint?: string;
  // NEVER exposed to client bundle:
  // correctOption and expectedPlaintext live in +page.server.ts load()
  // only the fields needed for display are passed to PageData
}

interface Lesson {
  id: string;                    // 'ch1-l2'
  title: string;
  slug: string;                  // URL segment
  contentMarkdown: string;
  challenge: Challenge;
}

interface Chapter {
  id: string;                    // 'ch1'
  number: number;
  slug: string;
  title: string;
  description: string;
  lessons: Lesson[];
  prerequisiteChapterId?: string;
}
```

**Quiz answer security:** The `correctOption` field is defined in the content TypeScript files but is **never included in `PageData`**. The `+page.server.ts` load function strips it from anything returned to the page. Answer validation happens in the form action: the action re-reads the content file server-side and compares. The correct answer never leaves the server.

### Challenge Keypair (for encrypt-message exercises)

The server holds one keypair — a "challenge keypair" whose public key is shown to users for encrypt-message exercises, and whose private key the server uses to decrypt and verify the user's ciphertext. This keypair is generated once, stored as:

- Public key: embedded in the relevant challenge's `setup.recipientPublicKey` in the content file
- Private key: `wrangler secret put CHALLENGE_PRIVATE_KEY` (armored, passphrase-protected)
- Passphrase: `wrangler secret put CHALLENGE_KEY_PASSPHRASE`

This is a service keypair, not a user keypair.

### Proposed Curriculum

**Chapter 1 — Your First Key** (prerequisite: none)
- L1: What is public-key cryptography? (explainer, 10 XP)
- L2: Key anatomy — fingerprints and key IDs (quiz, 25 XP)
- L3: Export and share your public key (explainer + quiz, 25 XP)
- L4: Register your key with this app (sign-message: sign the registration nonce, 50 XP)

**Chapter 2 — Signing & Verifying** (prerequisite: ch1)
- L1: What is a digital signature? (explainer, 10 XP)
- L2: Sign a message (sign-message, 75 XP)
- L3: Verify a signature (verify-signature, 75 XP)
- L4: Why signatures matter — non-repudiation (quiz, 25 XP)

**Chapter 3 — Encryption** (prerequisite: ch2)
- L1: Asymmetric encryption explained (explainer, 10 XP)
- L2: Encrypt a message (encrypt-message, 75 XP)
- L3: Decrypt a message (decrypt-message, 75 XP)
- L4: Sign and encrypt together (combined challenge, 100 XP)

**Chapter 4 — Trust & Identity** (prerequisite: ch3)
- L1: The web of trust (explainer, 10 XP)
- L2: Sign someone else's key (sign-key, 75 XP)
- L3: Key servers — what they are and the choice to use them (explainer → user choice: attempt upload or skip with no penalty, 25 XP)
- L4: Revocation certificates (quiz, 25 XP)

**Chapter 5 — Real-World PGP** (prerequisite: ch4)
- L1: Private key security and backups (quiz, 25 XP)
- L2: Key expiry and rotation (explainer + quiz, 25 XP)
- L3: PGP in email clients (explainer, 10 XP)
- L4: Capstone — decrypt a multi-part story encrypted to your key (decrypt-message, 150 XP + 200 XP chapter/graduate bonus)

### Progress: persisted vs derived

**Persisted in KV:** `completedLessons[]`, `completedChallenges[]`, `xp`, `achievements[]`, `lastActive`, `streakDays`, `streakLastDate`

**Derived at read time** (pure functions in `progress-utils.ts`): which chapters are unlocked, current chapter, % complete per chapter, lesson accessibility, streak validity (compare `streakLastDate` to today, reset if gap > 1 day).

---

## 7. Client/Server Boundary

| Operation | Location | Reason |
|---|---|---|
| Keypair generation | **User's own tool** (external) | App never touches private keys |
| Message signing | **User's own tool** (external) | Private key required; never in browser |
| Message encryption | **User's own tool** (external) | User encrypts to challenge keypair's public key |
| Message decryption | **User's own tool** (external) | Private key required; never in browser |
| Key parsing + fingerprint extraction | **Server only** | Authoritative identity resolution |
| Nonce generation | **Server only** | Must be server-authoritative |
| Signature verification (auth) | **Server only** | Client result is untrusted |
| Signature verification (tutorial) | **Server only** | Authoritative answer grading |
| Challenge ciphertext decryption | **Server only** | Uses challenge keypair private key |
| JWT issuance | **Server only** | `JWT_SECRET` never leaves server |
| Progress writes | **Server only** | Game state must be authoritative |
| Progress reads | **Server-side SSR** | No client round-trip; typed `PageData` |
| Tutorial content | **Server-side SSR** | Bundled; no KV read needed |
| Quiz correct answers | **Server only** | Never included in `PageData` |
| Copy-to-clipboard | **Client JS only** | Progressive enhancement; fallback is selectable `<pre>` |
| Form submission without reload | **Client JS only** | `use:enhance` progressive enhancement |
| Inline feedback (correct/incorrect) | **Client JS only** | Progressive enhancement; baseline is redirect + flash banner |

**No `openpgp.js` in the client bundle.** The browser never performs any cryptographic operations. `openpgp.js` is a server-only import.

---

## 8. Progressive Enhancement Strategy

The no-JS baseline must be complete and usable. JavaScript, when present, improves comfort but is never required.

| Feature | No-JS baseline | JS enhancement |
|---|---|---|
| Form submission | Full page reload | `use:enhance` — no reload, inline errors |
| Copy nonce/text to clipboard | `<pre>` block, manual select-all | Copy button via Clipboard API |
| Challenge feedback | Redirect + flash banner | Inline success/error panel without redirect |
| Achievement notification | Flash banner on next page load | Non-blocking toast notification |
| Collapsible sections (hints, instructions) | `<details><summary>` — native HTML | Optional: animated open/close |
| Mobile lesson tabs (Instruction / Workspace) | CSS `:target` tab pattern | JS-managed tab state with aria-selected |
| Progress bar animation | Static CSS `<progress>` fill | Animated fill transition on load |
| Display name edit | Full form → redirect | Inline edit with immediate feedback |
| Dark mode toggle | CSS `prefers-color-scheme` only | Optional JS-controlled class toggle |
| Key file upload (drag and drop) | `<input type="file">` only | Drag-and-drop zone overlay |

### CSS `:target` tab pattern (mobile lesson page)

```html
<!-- Default: instruction tab is shown -->
<nav>
  <a href="#instruction">Learn</a>
  <a href="#workspace">Do</a>
</nav>
<section id="instruction">...</section>
<section id="workspace">...</section>
```

```css
#workspace { display: none; }
#workspace:target { display: block; }
#instruction:target ~ #workspace,
#workspace:target ~ #instruction { display: none; }
```

When JS is present, click handlers manage tab state and update `aria-selected` for screen readers.

### Flash message system

Flash messages replace toast notifications as the no-JS mechanism for surfacing async events (achievement earned, chapter complete, login failed):

1. Form action writes `flash:v1:{fingerprint}` to `EPHEMERAL_KV` (TTL: 60s)
2. Root `+layout.server.ts` load function reads and **deletes** the flash on every page load
3. Flash data is passed to `PageData`
4. `+layout.svelte` renders `<FlashBanner>` if flash data is present
5. With JS: flash banner auto-dismisses after 4 seconds via a `setTimeout`
6. Without JS: flash banner is always visible until the user navigates away

---

## 9. Cloudflare Deployment Config

### `wrangler.toml`

```toml
name = "pretty-good-playground"
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

assets = { directory = ".svelte-kit/cloudflare/", binding = "ASSETS" }

[build]
command = "bun run build"

[[kv_namespaces]]
binding = "MAIN_KV"
id = "REPLACE_WITH_PRODUCTION_ID"
preview_id = "REPLACE_WITH_PREVIEW_ID"

[[kv_namespaces]]
binding = "EPHEMERAL_KV"
id = "REPLACE_WITH_PRODUCTION_ID"
preview_id = "REPLACE_WITH_PREVIEW_ID"

[vars]
PUBLIC_APP_URL = "https://pretty-good-playground.workers.dev"

# Secrets — never in this file; set via CLI:
# wrangler secret put JWT_SECRET
# wrangler secret put CHALLENGE_PRIVATE_KEY
# wrangler secret put CHALLENGE_KEY_PASSPHRASE
```

`nodejs_compat` is required because `openpgp.js` references `Buffer` internally.

### `src/app.d.ts`

```typescript
import type { KVNamespace } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Locals {
      user: { fingerprint: string; displayName?: string } | null;
      flash: { type: 'success' | 'error' | 'achievement' | 'info'; title: string; body?: string } | null;
    }
    interface PageData {
      user: App.Locals['user'];
      flash: App.Locals['flash'];
    }
    interface Platform {
      env: {
        MAIN_KV: KVNamespace;
        EPHEMERAL_KV: KVNamespace;
        JWT_SECRET: string;
        CHALLENGE_PRIVATE_KEY: string;
        CHALLENGE_KEY_PASSPHRASE: string;
        PUBLIC_APP_URL: string;
      };
      context: { waitUntil(promise: Promise<unknown>): void; };
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
```

### Security Headers (`hooks.server.ts`)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self';
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

`script-src 'self'` means only scripts served from the same origin are permitted. No CDN-loaded scripts, no inline scripts. SvelteKit's generated JS bundle is served from `'self'` so this is satisfied. The no-JS baseline means the app functions even if the browser blocks these scripts entirely.

### Local Development

`wrangler dev` runs the Worker locally with real KV preview namespaces. For pure `vite dev` without wrangler, `kv.ts` detects `platform == null` and falls back to an in-process `Map<string, string>` store. This keeps the dev feedback loop fast.

### Monetisation Notes

The app launches on the Workers free tier (100k reads/day, 1k writes/day). To extend free-tier capacity: cache progress reads in the session cookie (one KV read at login, no KV reads per page view). If the Workers Paid plan ($5/month) becomes necessary, this cost is coverable via voluntary support (GitHub Sponsors, Ko-fi) with a "Supporter" cosmetic badge on the profile page. Content is never paywalled — that conflicts with the educational mission.

---

## 10. Resolved Decisions

| Topic | Decision |
|---|---|
| Key generation | Not in-app. Users bring their own keys. `/resources` links to tools by platform. |
| Client-side crypto | None. Browser is a clipboard UI only. |
| Auth mechanism | PGP challenge/response via form actions. Two-step: `/login` then `/login/verify`. |
| Auth security | Secure: possessing a public key is insufficient — the attacker cannot sign without the private key. |
| Session duration | 30 days (default). Session-only if "Remember this device" is unchecked. |
| User primary key | PGP fingerprint (40 hex chars). No separate UUID needed. |
| Display names | User-chosen at registration. Non-unique — fingerprint is the canonical identity. |
| No account recovery | Intentional. Teaches the importance of private key backups. |
| Quiz answer exposure | Correct answers never leave the server. Validated in form actions only. |
| Key servers | Chapter 4 explains key servers, then offers a genuine choice. No XP penalty to skip. |
| Cryptocurrency/tokens | Not pursued. Regulatory risk and mission drift. XP remains the progression mechanic. |
| JavaScript requirement | JavaScript is never required. All core flows work via native HTML forms. JS is progressive enhancement. |
| Mobile support | Full support. Links to OpenKeychain (Android) and PGP Everywhere (iOS). |
| Content IDs | Permanent. Never rename or delete existing IDs — they exist in users' KV progress records. |

---

## 11. Critical Files to Create First

1. `src/app.d.ts` — declare `App.Platform`, `App.Locals`, `App.PageData`; everything else depends on these types
2. `vite.config.ts` — swap `adapter-auto` for `adapter-cloudflare`
3. `wrangler.toml` — KV namespaces, secrets, `nodejs_compat`
4. `src/hooks.server.ts` — JWT verification → `locals.user`; flash read → `locals.flash`; security headers
5. `src/lib/server/kv.ts` — typed KV abstraction with dev-mode `Map` fallback
6. `src/lib/server/auth.ts` — JWT sign/verify; cookie helpers
7. `src/lib/server/pgp.ts` — `readKey()`, `verify()`, fingerprint extraction (server-only)
8. `src/lib/server/rate-limit.ts` — dual-bucket sliding window
9. `src/lib/server/flash.ts` — write/read flash messages
10. `src/lib/shared/types.ts` — all shared TypeScript interfaces
