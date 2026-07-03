# Pretty Good Playground — Design & UX Plan

---

## Core Constraints

Two constraints shape every design decision:

1. **JavaScript is never required.** Every screen must be fully functional with JS disabled. JS is a progressive enhancement layer that improves comfort but is never a prerequisite. This means: no JS-only interactions for any core flow, native HTML form elements for all mutations, `<details>/<summary>` for collapsibles, CSS `:target` for tabs, server-rendered flash banners instead of JS toast notifications.

2. **Privacy-first ethos.** No email, no tracking, no third-party resources. The design must communicate this immediately and credibly to users who arrive already distrustful.

---

## 1. Design Language

### Color Palette

The palette draws from two registers: **trust and calm** (primary) and **achievement and delight** (accent). Deliberately not "hacker aesthetic" — no green-on-black, no neon, no CRT glow. Think Stripe meets Duolingo, minus the aggression. The goal is to make something that was previously scary feel approachable.

**Primary Brand — Indigo-Violet**

Indigo sits between the calm authority of blue and the creativity of purple. It is the color language of ProtonMail, Notion, and Linear — tools privacy-conscious users already trust.

| Role | Hex | Usage |
|---|---|---|
| Primary 700 | `#3730A3` | Hover states, active nav |
| Primary 600 | `#4F46E5` | Primary CTAs, links, focus rings |
| Primary 500 | `#6366F1` | Secondary actions, selected states |
| Primary 100 | `#E0E7FF` | Highlighted backgrounds, tag fills |
| Primary 50 | `#EEF2FF` | Subtle section backgrounds |

**Gamification Accent — Amber/Gold** (reserved exclusively for XP and rewards)

| Role | Hex | Usage |
|---|---|---|
| Gold 600 | `#D97706` | Achievement badge borders, XP labels |
| Gold 500 | `#F59E0B` | XP bar fill, star icons, level indicators |
| Gold 100 | `#FEF3C7` | Achievement card backgrounds |

**Neutral Scale — Warm Grays** (warm, not cool/blue-tinted — warmth aligns with approachability)

| Hex | Usage |
|---|---|
| `#111827` | Primary headings |
| `#374151` | Body text |
| `#6B7280` | Placeholder text, muted captions |
| `#D1D5DB` | Borders, dividers |
| `#F3F4F6` | Table row alternates |
| `#F9FAFB` | Page background |
| `#FFFFFF` | Card backgrounds, modals |

**Semantic Colors**

| Role | Hex | Tint | Usage |
|---|---|---|---|
| Success | `#059669` | `#D1FAE5` | Correct answers, completed states |
| Error | `#DC2626` | `#FEE2E2` | Wrong answers, validation errors |
| Warning | `#D97706` | `#FEF3C7` | Caution states |
| Info | `#0284C7` | `#E0F2FE` | Hint panels, informational callouts |

**Dark Mode** (supported from day one — privacy-focused users overwhelmingly prefer it):
- Page background: `#0F172A`
- Card background: `#1E293B`
- Primary text: `#F1F5F9`
- Secondary text: `#94A3B8`
- Brand primary shifts to `#818CF8` for AA contrast on dark
- Dark mode is detected via `prefers-color-scheme` CSS media query — no JS required

---

### Typography

**Display/Headings: Plus Jakarta Sans** — geometric, humanist warmth, premium feel at large sizes. Available via Google Fonts but self-hosted to avoid third-party requests.

**Body: Inter** — screen-optimised, comprehensive Latin coverage. Also self-hosted.

**Code/Keys: JetBrains Mono** — excellent character distinction (`0` vs `O`, `1` vs `l` vs `I`) critical for fingerprint reading and PGP block comparison. Self-hosted.

No fonts are loaded from external CDNs. All fonts are bundled with the app and served from `'self'` to satisfy the CSP.

**Type Scale** (base 16px, Major Third ratio 1.25)

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-5xl` | 48px | 1.15 | 700 | Chapter titles (desktop) |
| `text-4xl` | 36px | 1.2 | 700 | Page headings |
| `text-3xl` | 30px | 1.25 | 600 | Section headings |
| `text-2xl` | 24px | 1.3 | 600 | Card headings, modal titles |
| `text-xl` | 20px | 1.4 | 500 | Subheadings |
| `text-lg` | 18px | 1.5 | 400 | Lead paragraphs |
| `text-base` | 16px | 1.6 | 400 | Body text |
| `text-sm` | 14px | 1.5 | 400 | Labels, captions |
| `text-xs` | 12px | 1.4 | 400 | Badges, legal |
| `mono-base` | 14px | 1.6 | 400 | Inline key snippets |
| `mono-lg` | 16px | 1.6 | 400 | PGP block displays |

Letter spacing: headings at `-0.02em`. Body at `0`. Labels/caps at `0.05em`.

---

### Spacing System

Base unit: **8px**. All spacing is a multiple.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon-to-label gaps |
| `space-2` | 8px | Tight padding |
| `space-4` | 16px | Card padding (compact) |
| `space-6` | 24px | Card padding (standard) |
| `space-8` | 32px | Between-component gaps |
| `space-12` | 48px | Section rhythm |
| `space-16` | 64px | Major section breaks |
| `space-24` | 96px | Hero vertical padding |

---

### Component Style

**Border radius:**
- `4px` — small tags, inline badges
- `8px` — inputs, buttons, standard cards
- `12px` — modals, large cards, lesson panels
- `9999px` — pills, XP bars, avatar circles

Rounded corners test better with non-technical audiences and signal "safe" and "approachable." Hard corners evoke terminals and CLI tools — exactly the aesthetic being rejected.

**Shadow system** (subtle — depth through layering, not drama):
```
shadow-sm:  0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)   — cards
shadow-md:  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)   — elevated cards
shadow-lg:  0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05) — modals
```

**Iconography:** Lucide Icons, 1.5px stroke weight, MIT licensed. All decorative icons are `aria-hidden="true"`. All functional icons have an `aria-label` or adjacent visible label.

**Motion:** `200ms ease-out` for all transitions. No bounce, no spring physics. Animations respect `prefers-reduced-motion` — transitions reduce to immediate state changes when the media query is active.

---

## 2. Information Architecture

### Site Map

```
/ ................................ Landing / Home (public)
/resources ........................ PGP tool links by platform (public)
/about ........................... About the project, source code (public)
/register ........................ Registration: paste public key + choose display name
/login ........................... Login step 1: paste public key
/login/verify .................... Login step 2: displays nonce, paste signed output
/dashboard ....................... Learning map (requires session)
/learn/[chapterId] ............... Chapter overview (requires session)
/learn/[chapterId]/[lessonId] .... Lesson + challenge workspace (requires session)
/profile ......................... Personal achievements + profile (requires session)
/profile/[fingerprint] ........... Public-facing profile (public, if user opted in)
/keys ............................ Key management + danger zone (requires session)
/lost-my-key ..................... Key loss help (public)
/logout .......................... Clears session cookie, redirects to /
```

No `/login` page exists at a URL separate from `/register`. Registration and login are separate flows but both are entry points for new and returning users respectively. There is no `/settings` — settings are minimal and live in `/keys`.

### Navigation

**Unauthenticated top bar:** Logo → About → Resources → [Primary button] "Get Started →"

**Authenticated top bar:** Logo → Dashboard → Profile → Keys → About → [Ghost button] "Sign Out"

Minimal. No dropdowns, no notification bells, no avatar menus. Social-app navigation patterns carry connotations that undermine the privacy ethos.

**Mobile (authenticated):** Bottom tab bar replaces top nav: Dashboard · Profile · Keys · About.

---

## 3. User Journey Maps

### Journey 1 — New User

1. **Landing page** — reads hero, notices trust signals, clicks "Get Started"
2. **Resources page** — if they don't have a key, guided to appropriate tool for their platform. Link away, generate key, return.
3. **Register** (`/register`) — pastes public key, enters display name, submits form
4. **Login step 1** (`/login`) — pastes same public key, submits form
5. **Login step 2** (`/login/verify`) — server shows nonce; user copies it, signs it with their PGP tool, pastes signed output, submits
6. **Dashboard** — flash banner: "Welcome. Your journey starts here." Chapter 1 is unlocked.

**Emotional arc:** Curious → Slightly unsure (need a key?) → Guided → Slightly confused (signing a nonce?) → Accomplished → Ready

### Journey 2 — Returning User

1. Navigates directly to site or bookmarked `/dashboard`
2. Redirected to `/login` (no session or expired session)
3. Pastes public key → step 2 → signs nonce → back to dashboard in ~45 seconds
4. "Continue where you left off" CTA is the most prominent element on the dashboard

### Journey 3 — Lost Key

1. From `/login`, small "Can't find your key?" link
2. `/lost-my-key` page:
   - Validates the feeling: "This is frustrating. We get it."
   - Sets expectations: "There's no reset password — and that's actually a feature."
   - Platform-specific recovery checklist: macOS Keychain, Kleopatra, GPG keyring, OpenKeychain backup, file system search
   - Fresh start option: "Your key is truly gone? You can start again with a new key. Progress won't carry over, but what you learned stays with you."
3. Tone throughout: empathetic, non-judgemental, patient. Never "told you so."

---

## 4. Screen-by-Screen UX Spec

### Screen 1 — Landing Page (`/`)

**Layout:** Single column, full-width hero, sections below. No sidebar.

**Hero:**
- Eyebrow (small caps, Gray 500): `LEARN PGP ENCRYPTION`
- Headline (text-5xl, Plus Jakarta Sans 700): `Privacy is a skill. Let's learn it together.`
- Subhead (text-xl, max-width 560px): `Pretty Good Playground teaches you how to use PGP encryption through hands-on challenges — no cryptography background required.`
- Primary CTA button (large, full-width on mobile): `Get Started →` → `/resources` if no key yet, or `/register` if user knows what they're doing
- Trust signal row (three items, flex, stack on mobile):
  - `Your private key never leaves your browser`
  - `No account required to read — sign up only to track progress`
  - `Open source on GitHub`

Trust signals live in the hero, not the footer. Privacy-conscious users look for red flags immediately. Resolving concerns before they scroll is essential.

**"What you'll learn" section:** Six chapter cards in a horizontal row (vertical on mobile), non-interactive, showing title and one-line description.

**"How it works" section:** Three-step explainer.
1. Get a PGP key — "Use GPG, Kleopatra, or OpenKeychain. We'll point you to the right tool." (Link to `/resources`)
2. Complete interactive challenges — "Learn by doing. Sign messages, encrypt files, verify signatures — with your own tools."
3. Level up — "Track progress, earn XP, unlock chapters."

**Footer:** Logo · About · GitHub · Resources · `/lost-my-key` · Privacy note ("No cookies except your session. No analytics. No third-party requests. [What we store →]")

---

### Screen 2 — Resources Page (`/resources`)

**Layout:** Narrow single column, max-width 720px.

**Purpose:** The replacement for in-app key generation. Users who don't have a PGP key yet come here to learn which tool to use and how to get started. Also serves as a reference throughout the tutorial when platform-specific commands are needed.

**Content structure:**

Headline: `Get your PGP tools`
Subhead: `Choose your platform. Each of these tools can generate a key pair, sign messages, and handle everything the tutorial asks of you.`

Platform sections (each has a heading, tool name, brief description, installation link, and the one key command to generate a key):

- **Linux** — GPG (pre-installed on most distros). `gpg --gen-key`
- **macOS** — GPG Suite (GUI + CLI). Also works with Homebrew GPG.
- **Windows** — Kleopatra / Gpg4win (GUI). Also: GPG via Scoop or Chocolatey.
- **Android** — OpenKeychain. Free, open source. Key generation in-app.
- **iOS** — PGP Everywhere. Key generation in-app.

Each section ends with: "Once you've generated your key, [Register here →]"

A collapsible `<details>` section at the bottom: `What is a key pair?` — plain-language explanation using the mailbox analogy.

---

### Screen 3 — Registration (`/register`)

**Layout:** Centered, max-width 640px. "Focus mode" — top bar simplified to logo only. No sidebar.

**Headline:** `Register your key`
**Subhead:** `Paste your armored public key below. This is the key that starts with "-----BEGIN PGP PUBLIC KEY BLOCK-----".`

**Form elements:**
1. Display name input (text, required): Label: `Choose a display name`, placeholder: `Alice`, helper text: `This can be anything. It's shown on your profile but your fingerprint is your real identity.`
2. Public key textarea (large, JetBrains Mono, ~240px height): Label: `Your public key (armored)`, placeholder: `-----BEGIN PGP PUBLIC KEY BLOCK-----`
3. Submit button: `Register →`

**Server-side validation errors** (rendered inline after form submission — no JS needed):
- Missing key: `Please paste your public key.`
- Invalid key block: `That doesn't look like a complete PGP public key. Make sure you've copied the entire block, including the "-----BEGIN" and "-----END" lines.`
- Already registered: `This key is already registered. [Sign in instead →]`

**Below the form:** `Don't have a key yet? [Get your PGP tools →]` (links to `/resources`)

**After successful registration:** Redirect to `/login` with flash banner: "Key registered. Sign in to continue."

---

### Screen 4 — Login Step 1 (`/login`)

**Layout:** Same as `/register` — centered, max-width 640px, focus mode.

**Headline:** `Sign in`
**Subhead:** `Paste your public key to identify yourself. We'll ask you to sign a short message to confirm it's yours.`

**Flash banner area** (top of content, above headline): Renders server-side flash messages if present (e.g., "Registration complete — sign in to continue"). Styled per flash type. Visible without JS.

**Form elements:**
1. Public key textarea (JetBrains Mono): Label: `Your public key (armored)`
2. "Remember this device" checkbox: checked by default. Label: `Stay signed in for 30 days`. Unchecked = session cookie only.
3. Submit button: `Continue →`

**Below form:**
- `Don't have an account? [Register →]`
- `Can't find your key? [Help →]` (links to `/lost-my-key`)

**Server-side error states:**
- No account found: `No account is registered for this key. [Register →]`
- Invalid key: `That doesn't look like a valid PGP public key.`
- Rate limited: `Too many attempts. Please wait a minute and try again.`

---

### Screen 5 — Login Step 2 (`/login/verify`)

The most technically complex UX moment. Non-technical users may not know what "signing a message" means. The design must make this comprehensible without requiring prior knowledge.

**Layout:** Centered, max-width 680px, focus mode. Step-by-step — the page is structured so the action flows top to bottom.

**Session state:** If no pending challenge is found in KV (expired or missing), the `load()` function redirects back to `/login` with a flash: "Your session expired. Please start again."

**Headline:** `Prove it's you`
**Subhead:** `We've generated a short random code. Sign it with your private key to confirm you're the owner of this account.`

**Analogy callout** (InfoBox, info tint): `Think of this like a wax seal. You're not hiding the message — you're proving it came from you.`

**Step 1 — The code to sign**

A card containing:
- Label: `Copy this code`
- The nonce displayed in a `<pre>` block (JetBrains Mono, selectable, full width)
- A `<p>` instruction: `Select the text above and copy it.`
- JS enhancement: a "Copy to clipboard" button appears when JS is available

**Step 2 — Sign it with your tool**

A `<details><summary>How do I sign this?</summary>` block containing platform-specific instructions:

```
GPG (Linux/macOS/Windows):
  echo "PASTE_CODE_HERE" | gpg --clearsign

Kleopatra (Windows):
  Tools → Notepad → paste the code → click "Sign"

GPG Suite (macOS):
  Services menu → OpenPGP: Sign Text

OpenKeychain (Android):
  Apps → OpenKeychain → Encrypt/Sign → sign mode → paste code

PGP Everywhere (iOS):
  New message → sign → paste code
```

**Step 3 — Paste the signed output**

```html
<form method="POST">
  <label for="signed">Paste the signed output here</label>
  <textarea id="signed" name="signed" rows="12"
    placeholder="-----BEGIN PGP SIGNED MESSAGE-----"></textarea>
  <button type="submit">Verify →</button>
</form>
```

**Error states (rendered on form re-submission — no JS needed):**
- Wrong key: `This signature doesn't match your registered key. Make sure you're signing with the private key that goes with your public key.`
- Invalid format: `That doesn't look like a signed PGP message. Make sure you copied the entire output, including all header lines.`
- Expired challenge: `This sign-in session expired. [Start again →]`
- Each error shows the step-by-step instructions again so users don't have to scroll back up.

**Success:** Redirect to `/dashboard` with flash: "Welcome back."

---

### Screen 6 — Learning Dashboard (`/dashboard`)

**Layout:** Two-column on desktop (course map 70%, stats sidebar 30%). Single column on mobile (stats collapsed into a `<details>` above the map).

**Flash banner area** at the top — achievement banners render here without JS.

**Stats Sidebar:**
- Fingerprint chip (first 8 chars, JetBrains Mono, large)
- Level badge: `Level 3 — Apprentice`
- XP bar: `<progress value="320" max="500"></progress>` with label `320 / 500 XP` — CSS-styled `<progress>` element, no JS required
- Recent achievements (last 3 badges)
- `<details><summary>Your Progress</summary>` on mobile wrapping the above

**Course Map (main content):**

A vertical pathway of chapter cards connected by a visual line. Cards are ordered top to bottom. Each card:
- Chapter number + title
- One-line description
- `<progress>` bar showing lesson completion
- Status: Unlocked (full color) / Locked (gray + lock icon) / Completed (green check)
- CTA: `Begin` / `Continue` / `Review` — a plain `<a>` link

A "Continue where you left off" panel sticks near the top of the map if progress exists. It shows the last lesson with a direct `<a>` link. No JS — it's rendered server-side based on progress data.

**Chapter order:**
1. Your First Key
2. Signing & Verifying
3. Encryption
4. Trust & Identity
5. Real-World PGP

**Empty state (all locked except Chapter 1):** Chapter 1 is visually highlighted with a subtle ring. Locked chapters are grayed with a lock icon. Below: `Chapters unlock as you complete the previous one.`

---

### Screen 7 — Lesson Page (`/learn/[chapterId]/[lessonId]`)

**Layout (desktop):** Two-column split (50/50). Left: instruction panel. Right: workspace panel.

**Layout (mobile):** CSS `:target` tab pattern. Default: instruction panel visible. Link `#workspace` tab switches to workspace. Link `#instruction` tab switches back. With JS available, enhanced to managed tab state with `aria-selected`.

The app's top nav is replaced on lesson pages by a minimal header: back arrow (to chapter overview) · `Chapter Title > Lesson Title` breadcrumb · lesson progress indicator (e.g. "Challenge 2 of 3") · XP display.

**Instruction Panel:**

- Lesson title (text-2xl)
- Markdown content rendered server-side (no JS client-side renderer)
- Technical terms marked with `<abbr title="plain-language definition">term</abbr>` — browser-native tooltip, no JS required. With JS: enhanced to a styled popover.
- Hint system as `<details>` elements:
  ```html
  <details>
    <summary>Need a hint? (costs 5 XP)</summary>
    <p>First hint text...</p>
    <details>
      <summary>Another hint? (costs 10 XP more)</summary>
      <p>Second hint...</p>
    </details>
  </details>
  ```
  Hints are shown immediately on `<details>` open — no server round-trip. XP costs are deducted when the lesson is submitted (the form tracks which hints were opened via hidden inputs).

**Workspace Panel:**

The workspace is contextual to the challenge type. All workspaces are `<form method="POST">` elements.

**sign-message workspace:**
```html
<p>Sign this message with your PGP key:</p>
<pre>{{ challenge.setup.plaintextToSign }}</pre>
<!-- JS enhancement: copy button -->
<label for="answer">Paste your signed output:</label>
<textarea id="answer" name="answer" rows="10"
  placeholder="-----BEGIN PGP SIGNED MESSAGE-----"></textarea>
<input type="hidden" name="hintsUsed" value="{{ hintsUsed }}">
<button type="submit">Submit →</button>
```

**verify-signature workspace:**
```html
<p>Verify this signed message with your PGP tool:</p>
<pre>{{ challenge.setup.signatureToVerify }}</pre>
<label for="answer">What does the message say?</label>
<textarea id="answer" name="answer" rows="4"
  placeholder="Type the message content here"></textarea>
<button type="submit">Submit →</button>
```

**encrypt-message workspace:**
```html
<p>Encrypt this message to the following public key:</p>
<pre class="key-block">{{ challenge.setup.recipientPublicKey }}</pre>
<p>Message to encrypt: <code>{{ challenge.setup.plaintextToSign }}</code></p>
<label for="answer">Paste your encrypted output:</label>
<textarea id="answer" name="answer" rows="10"
  placeholder="-----BEGIN PGP MESSAGE-----"></textarea>
<button type="submit">Submit →</button>
```

**decrypt-message workspace:**
```html
<p>Decrypt this message using your private key:</p>
<pre>{{ challenge.setup.ciphertextToDecrypt }}</pre>
<label for="answer">What does it say?</label>
<textarea id="answer" name="answer" rows="4"></textarea>
<button type="submit">Submit →</button>
```

**quiz workspace:**
```html
<fieldset>
  <legend>{{ challenge.prompt }}</legend>
  {% for option in challenge.quizOptions %}
  <label>
    <input type="radio" name="answer" value="{{ loop.index }}">
    {{ option }}
  </label>
  {% endfor %}
</fieldset>
<button type="submit">Submit →</button>
```

**Feedback after submission:** The form action validates the answer server-side and redirects back to the same page. The `load()` function includes `{ lastResult: 'correct' | 'incorrect', explanation: string }` in `PageData` when present. The page renders a feedback banner at the top of the workspace:

- **Correct:** Green InfoBox with checkmark, explanation, XP awarded (e.g. `+50 XP`), and "Next Lesson →" link
- **Incorrect:** Red InfoBox with explanation and "Try Again" (the form is visible below for resubmission)

With JS available (`use:enhance`), the redirect is intercepted and feedback renders inline without a page reload.

**Achievement flash:** If an achievement was earned, it appears in the flash banner area at the top of the page on the next load.

---

### Screen 8 — Profile Page (`/profile`)

**Layout:** Single column, max-width 800px, centered.

**Profile Header:**
- Fingerprint (JetBrains Mono, formatted in groups of 4, centered, large)
- Display name (editable via a small form action — pencil icon, JS enhancement for inline edit, falls back to a separate edit form)
- Level badge
- XP total

**Privacy Toggle:** A `<form method="POST">` with a checkbox:
```html
<form method="POST" action="?/setVisibility">
  <label>
    <input type="checkbox" name="public" {{ checked if profile.public }}>
    Make my profile public
  </label>
  <button type="submit">Save</button>
</form>
```
Defaults to unchecked (private). Opt-in to public sharing, never opt-out.

When public: `Your profile is visible at /profile/{{ fingerprint }}`. When private: `Only you can see this page.`

**Achievements Grid:** 3-column on desktop, 2-column on mobile.

Each badge:
- Badge icon (48px, illustrative)
- Achievement name
- Date earned, or gray + padlock if locked

Locked badges show title only, not description — deliberate mystery (Zeigarnik effect).

**Chapter Summary:** One row per chapter, showing completed/in-progress/not-started with percentage.

---

### Screen 9 — Key Management (`/keys`)

**Layout:** Single column, max-width 680px. Sections separated by `<hr>` dividers.

**Section 1 — Your Key:**
- Full fingerprint, formatted in groups of 4
- Algorithm info (e.g. "RSA 4096-bit, created 2024-03-15")
- `<details><summary>Show public key</summary><pre>...</pre></details>` with a "Download .asc" link below

**Section 2 — Danger Zone** (red-bordered `<section>`):

```html
<form method="POST" action="?/deregister">
  <p>Deregistering removes your progress from this app.
     It does not delete or change your PGP key in any way.</p>
  <label for="confirm">Type DEREGISTER to confirm:</label>
  <input id="confirm" name="confirm" type="text" autocomplete="off">
  <button type="submit">Deregister this key</button>
</form>
```

The form action checks that `confirm === 'DEREGISTER'` before proceeding. Returns `fail(400)` with an error if not. No JS modal — the confirmation input provides the friction.

---

## 5. Gamification Mechanics

### XP System

| Action | XP |
|---|---|
| Complete challenge (1st attempt) | 50 |
| Complete challenge (2nd attempt) | 35 |
| Complete challenge (3rd+ attempt) | 20 |
| Complete a chapter | +200 bonus |
| No hints used in chapter | +100 bonus |
| Perfect chapter (all 1st-attempt) | +150 bonus |
| Daily return (any activity) | +25 |

XP never decreases. The "penalty" for hints is not earning the bonus — a regret mechanic, not a punishment.

### Levels

| Level | XP | Title |
|---|---|---|
| 1 | 0 | Curious Beginner |
| 2 | 200 | Key Holder |
| 3 | 500 | Apprentice |
| 4 | 1,000 | Signer |
| 5 | 1,800 | Encryptor |
| 6 | 2,800 | Verifier |
| 7 | 4,200 | Web Weaver |
| 8 | 6,000 | Key Custodian |
| 9 | 8,500 | Trusted Signer |
| 10 | 12,000 | Cryptographer |
| 11+ | +4,000/level | Distinguished Cryptographer |

Completing all five chapters earns approximately 2,800–4,200 XP (level ~7).

### Achievement Definitions

**Learning:**
- `first_lesson` — Complete your first lesson
- `chapter_1_complete` through `chapter_5_complete` — One per chapter
- `all_chapters_complete` — Complete the entire curriculum
- `perfect_run` — Complete any chapter without using a hint
- `graduate` — Complete Chapter 5

**Skill:**
- `first_signature` — Successfully sign your first message
- `first_verification` — Verify your first signed message
- `first_encryption` — Encrypt your first message
- `first_decryption` — Decrypt your first message
- `web_weaver` — Sign someone else's key
- `key_publisher` — Complete the key server lesson

**Community:**
- `open_book` — Make your profile public
- `ambassador` — Share your profile link (detected by button click with JS; one-time, honesty-based)

**Special (hidden — title shown, description hidden until earned):**
- `persistence` — Attempt a challenge 5+ times before succeeding
- `night_owl` — Complete a lesson after midnight (local time, inferred from submission timestamp)
- `paranoid_compliment` — Complete the entire tutorial using only external tools (never opened a `<details>` hint)

### Progress Visualization

**XP bar:** `<progress>` element with inline style percentage — CSS styled, no JS. With JS: animated fill on load.

**Course map connector:** CSS-only visual line between chapter cards. Completed sections get a different color via CSS class applied server-side.

**Achievement notification:** Rendered as a flash banner on the next page load after an achievement is earned. Styled with gold tint background and badge icon. With JS: also shows as a non-blocking toast that auto-dismisses in 4 seconds.

---

## 6. Accessibility Checklist

### Color & Contrast

- Body text `#374151` on `#FFFFFF`: **10.7:1** — well above AA (4.5:1 minimum)
- Primary CTA `#FFFFFF` on `#4F46E5`: **5.9:1** — passes AA
- Gray 500 placeholder `#6B7280` on white: **4.6:1** — passes AA
- Error `#DC2626` on white: **5.8:1** — passes AA
- Information is never conveyed by color alone — errors have icons and text; success states have checkmarks

### Keyboard Navigation

- Tab order follows visual reading order
- All interactive elements have a visible focus ring: `outline: 2px solid #4F46E5; outline-offset: 2px` — never `outline: none` without equivalent custom indicator
- `<details>/<summary>` elements are natively keyboard-operable (Enter/Space to toggle)
- Skip navigation link: first tab stop on every page, visually hidden but focusable: "Skip to main content"
- All form inputs have associated `<label>` elements (not just `placeholder`)

### Screen Readers

- All decorative icons: `aria-hidden="true"`
- All functional icons: `aria-label` or adjacent visible text
- PGP key display blocks: `<code>` element so screen readers announce them correctly; copy button has `aria-label="Copy public key to clipboard"`
- `<progress>` elements: `aria-label` describing what is measured
- Achievement badges (locked): announced as "Achievement [Name], locked" via `aria-label`
- Flash banners: wrapped in `role="status"` or `role="alert"` depending on urgency
- Lesson feedback: `role="status"` on the feedback area so screen readers announce results
- Step indicators in login flow: `aria-current="step"` on the active step
- Lesson tabs (mobile): when JS-enhanced, `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`

### Motion & Sensory

- All animations respect `prefers-reduced-motion`: transitions reduce to immediate state changes
- No auto-playing animations longer than 5 seconds
- No flashing or strobing effects

### Forms

- Required fields: `aria-required="true"` + asterisk in label + note at form level explaining asterisk
- Error messages: `aria-describedby` linking input to its error
- Character-sensitive inputs (keys, fingerprints): `<code>` or `<pre>` elements; recommend using JetBrains Mono for legibility
- File upload: explicit `<button>` as alternative to drag-and-drop for keyboard and screen reader users

### Cognitive Accessibility

- Reading level: Grade 8 (Flesch-Kincaid) or below for instructional content
- One primary action per screen — avoid decision paralysis
- Error messages explain what went wrong AND what to do next
- No time limits on any interactive element
- Progress is always saved automatically — users never fear losing work

### Progressive Enhancement & Screen Readers

When JS is disabled and CSS `:target` tab patterns are used on the lesson page, both panels remain in the DOM (just styled differently). Screen readers read both regardless of visual state — this is acceptable because the content in both tabs is complementary, not redundant.

---

## 7. Copy & Tone Guidelines

### Voice

A knowledgeable friend who happens to be a security researcher. Not a professor, not a corporate brand, not a hacker showing off.

- **Warm and direct:** Short sentences. No unnecessary hedging. No passive voice.
- **Curious, not condescending:** Assume the reader is intelligent but unfamiliar. Never say "simply" or "just."
- **Honest about difficulty:** "This part is a little tricky — don't worry if it takes a few tries."
- **Respectful of privacy as a value:** Privacy is normal, not paranoid.

**Banned words:** "simply," "just," "easily," "trivially," "obviously," "of course," "clearly" — they create shame when something is difficult.

### Approved Analogies (use consistently throughout)

| Concept | Analogy |
|---|---|
| Public key | "Your mailbox slot — anyone can drop a letter in" |
| Private key | "The key that opens your mailbox" |
| Key pair | "Two keys: one you share with the world, one you keep secret" |
| Encryption | "Locking a letter in a box only the recipient can open" |
| Decryption | "Opening a box you received, using your private key" |
| Digital signature | "A wax seal on a letter — proves who sent it and that it wasn't tampered with" |
| Signature verification | "Checking the wax seal is genuine" |
| Key fingerprint | "A short summary of your key — like a phone number for your identity" |
| Web of trust | "Vouching for friends: if I trust Alice and Alice trusts Bob, I have some reason to trust Bob" |
| Key server | "A public phonebook for PGP keys" |
| ASCII armor | "Turning your key's binary data into letters you can copy-paste" |
| Passphrase | "A lock on your key file — even if someone steals the file, they need this too" |

### Key Copy Moments

**Landing hero:** `Privacy is a skill. Let's learn it together.`

**Register page subhead:** `Paste your armored public key below. This is the key that starts with "-----BEGIN PGP PUBLIC KEY BLOCK-----".`

**Login step 2 analogy:** `Think of this like a wax seal. You're not hiding the message — you're proving it came from you.`

**Lost key headline:** `We can't recover your key. Here's why that's actually a good thing.`

**First lesson completion flash:** `You just signed a message with a cryptographic key. That's not nothing.`

**Danger zone deregister:** `Deregistering your key removes your progress from this app. It does not delete or change your actual PGP key in any way. Your key is yours — we're just forgetting our end of the association.`

**Error — wrong key at login:** `This signature doesn't match your registered key. Make sure you're signing with the private key that corresponds to the public key you registered.`

**Error — invalid PGP block:** `That doesn't look like a complete PGP block. Make sure you've copied the entire thing, including the "-----BEGIN" and "-----END" lines.`

**Resources page headline:** `Get your PGP tools`

---

## 8. Component Inventory

### Layout

| Component | Purpose |
|---|---|
| `AppHeader` | Top navigation; variants: `unauthenticated`, `authenticated`, `minimal` (login/register) |
| `BottomTabBar` | Mobile authenticated navigation |
| `FlashBanner` | Server-rendered flash message; variants: `success`, `error`, `achievement`, `info`; auto-dismisses with JS |
| `PageContainer` | Max-width wrapper; variants: `wide` (1200px), `default` (800px), `narrow` (640px) |
| `TwoPanel` | 50/50 horizontal split; collapses to `:target` tabs on mobile |
| `Footer` | Minimal footer with privacy note |

### Cards & Display

| Component | Purpose |
|---|---|
| `ChapterCard` | Dashboard course map card; variants: `locked`, `in-progress`, `completed` |
| `LessonCard` | Chapter overview lesson list item |
| `AchievementBadge` | Badge icon + name + date; variants: `earned`, `locked` |
| `FingerprintDisplay` | Monospace fingerprint; variants: `full`, `short` (8 chars), `large` |
| `KeyDisplayBlock` | Armored key in `<details><summary>` with download link; variants: `public` |
| `InfoBox` | Callout/explainer; variants: `info`, `warning`, `success`, `danger` |
| `LevelBadge` | Level number + title; variants: `compact`, `large` |

### Forms & Inputs

| Component | Purpose |
|---|---|
| `MonoTextarea` | JetBrains Mono textarea for PGP content |
| `TextInput` | Standard labeled text input with error state |
| `CopyBlock` | `<pre>` with optional JS copy button; keyboard-selectable fallback |
| `FileInput` | `<input type="file">` with optional JS drag-drop zone |
| `ProgressBar` | CSS-styled `<progress>` element; variants: `xp`, `lesson`, `chapter` |

### Workspaces (all are `<form method="POST">` elements)

| Component | Challenge Type |
|---|---|
| `SignWorkspace` | `sign-message` |
| `VerifyWorkspace` | `verify-signature` |
| `EncryptWorkspace` | `encrypt-message` |
| `DecryptWorkspace` | `decrypt-message` |
| `QuizWorkspace` | `quiz` |
| `ExplainerWorkspace` | `explainer` (just a submit button: "Mark as complete") |

### Feedback & Navigation

| Component | Purpose |
|---|---|
| `FeedbackPanel` | Inline correct/incorrect result; rendered server-side on redirect; enhanced with JS |
| `StepIndicator` | Numbered step tracker for multi-step flows (login, onboarding) |
| `BreadcrumbTrail` | Chapter > Lesson navigation |
| `LessonProgressBar` | Segmented bar: one segment per challenge in the lesson |

---

## 9. Mobile Considerations

### General Approach

Full mobile support. Users on Android use OpenKeychain; users on iOS use PGP Everywhere. Both apps can sign messages and handle PGP operations. The tutorial's copy-paste workflow is more friction on mobile but entirely possible.

### Key Mobile Patterns

**Tab navigation on lesson page (CSS `:target`):**

```html
<nav class="lesson-tabs">
  <a href="#instruction" aria-label="Instruction panel">Learn</a>
  <a href="#workspace" aria-label="Workspace panel">Do</a>
</nav>
<section id="instruction"><!-- lesson content --></section>
<section id="workspace"><!-- challenge form --></section>
```

```css
@media (max-width: 768px) {
  #workspace { display: none; }
  #workspace:target { display: block; }
  #instruction:target { display: block; }
  #instruction:not(:target):not(:has(~ #workspace:target)) { display: block; }
}
```

Default shows the instruction panel. Tapping "Do" navigates to `#workspace`.

**Key/nonce display on mobile:**
- PGP blocks in horizontally-scrolling `<pre>` elements — `overflow-x: auto`
- Download button prioritised over copy button (more reliable on mobile)
- Minimum font size: 14px for monospace (smaller is unreadable on mobile)

**Form inputs on mobile:**
- All textareas: minimum height 120px
- Visible "Select all" text above long PGP blocks (platform convention not always clear)
- Submit button: full width, minimum height 48px (WCAG touch target)
- When virtual keyboard appears, ensure submit button remains visible/scrolls into view

**Stats panel on dashboard:** Collapses into `<details><summary>Your Progress</summary>` above the course map on mobile.

**Hint system:** `<details>/<summary>` is well-supported on all mobile browsers and works with one tap.

**Private browsing warning:** A one-time banner on the dashboard (shown via flash after first login): "If you're using private/incognito mode, your session won't persist between browser sessions."

### Touch Targets

All interactive elements: minimum 44×44px touch target (WCAG 2.5.5 AAA). Achieved via padding on small elements (icon buttons, checkboxes, navigation tabs) even if the visible element is smaller.

### Offline Behaviour

The app requires a network connection (it is server-rendered). However, because there is no client-side JavaScript required, the pages are lightweight and load quickly on slow connections. No service worker is required. The tutorial explicitly tells users that PGP operations happen in their own PGP tool (which may work offline), not in the browser.

---

## 10. Design Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| No in-app key generation | Users bring their own keys | Never handle private keys; teaches real-world tools |
| No client-side JS requirement | All flows work via native HTML forms | Resilience, privacy (no JS = no potential client-side leak), ideological alignment |
| `<details>/<summary>` for collapsibles | Native HTML | Works without JS; keyboard accessible by default; browser-rendered |
| CSS `:target` for mobile tabs | CSS only | Works without JS; simple; degrades gracefully |
| Flash banners over toast notifications | Server-rendered | Allows achievement notifications without JS |
| Server-side Markdown rendering | No client-side parser | No JS bundle; content renders in initial HTML |
| Self-hosted fonts | No Google Fonts CDN | No third-party requests; satisfies strict CSP; privacy |
| `<progress>` for progress bars | Semantic HTML | Native accessibility; CSS-styleable; no JS needed |
| Form actions over fetch-to-API | SvelteKit form actions | No-JS baseline; `use:enhance` adds enhancement on top |
| Quiz answers server-side only | Never in PageData | Prevents client bundle inspection for answers |
| Fingerprint as identity, non-unique display names | Keep it simple | Fingerprint is already globally unique; display names are cosmetic |
