# ESK Storefront Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the approved theme spec's design tokens into the codebase — light+dark color tokens as Tailwind v4 `@theme` custom properties, the Inter typeface loaded via `next/font/google`, the Tailwind v4 class-based dark-mode CSS strategy, and the app favicon — so that every future component built on this scaffold can use real brand-consistent utility classes (`bg-primary`, `text-text-muted`, `font-sans`, etc.) instead of the ad-hoc `slate-*` placeholder classes used during the structural scaffold.

**Architecture:** All color tokens are defined once as CSS custom properties inside a Tailwind v4 `@theme` block in `app/globals.css` (light values) with a `.dark { ... }` override block providing the dark-mode values — Tailwind auto-generates matching utility classes from both, so no `dark:` variant prefixes are needed for base color usage. The Inter font is loaded once in the root layout and exposed as a CSS variable Tailwind's `--font-sans` token points to. The favicon uses Next.js's file-based `app/icon.png` convention. No dark/light toggle UI or store is built in this plan — only the CSS-level mechanism the toggle will later flip a `.dark` class to consume.

**Tech Stack:** Tailwind CSS v4 (`@theme`, `@custom-variant`), `next/font/google` (Inter), Next.js App Router file-based icon convention.

**Spec:** `docs/superpowers/specs/2026-09-05-esk-storefront-theme-design.md`

## Global Constraints

- All color values are copied **verbatim** from the theme spec's §3 token table — do not invent, round, or "improve" any hex value.
- Token names in `app/globals.css` must match the spec's semantic names exactly (`--color-background`, `--color-surface`, `--color-surface-elevated`, `--color-text-primary`, `--color-text-muted`, `--color-border`, `--color-primary`, `--color-primary-hover`, `--color-accent-tint`, `--color-accent-tint-strong`, `--color-button-secondary-bg`) — later component work will reference these exact names.
- The spec's §7 shadow value is finalized in this plan (the spec explicitly deferred the exact number to "the implementation plan stage"): `--shadow-card` token, light `0px 4px 24px 0px rgba(0,0,0,0.08)`, dark `0px 4px 24px 0px rgba(0,0,0,0.32)` (higher opacity so it reads against a dark surface). Border radius uses Tailwind's built-in `rounded-lg`/`rounded-xl` utilities directly — no custom radius token needed.
- Dark mode is **class-based** (`.dark` on an ancestor element, typically `<html>`), not `prefers-color-scheme`-only — per the spec, a future toggle button will add/remove this class and persist the choice; this plan only builds the CSS side that toggle will drive.
- No dark/light toggle button, store, or persistence logic in this plan — that is explicitly deferred to the next (component-level) implementation plan per the spec's §8/§9.
- No header/footer/navigation visual redesign in this plan — per the spec's §8, layout component design is out of scope here. This plan only makes tokens/font/favicon available; it does not apply them to existing placeholder pages.
- JavaScript only, no TypeScript. Project files stay at the repo root — no `src/` directory.

---

## File Structure

```
app/
  globals.css     (modified — add @theme color tokens, dark overrides, font token)
  layout.js       (modified — load Inter font, apply font-sans to body)
  icon.png        (new — favicon, copied from assets/ESK_icon_mini.png)
```

No new files beyond `app/icon.png`; no new dependencies (Tailwind v4 and Next.js's built-in font loader are already installed from the scaffold plan).

---

### Task 1: Light + dark color and shadow tokens in `app/globals.css`

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes generated from the `--color-*` custom properties below (e.g. `bg-primary`, `text-text-primary`, `border-border`, `bg-surface`, `bg-accent-tint`) and a `shadow-card` utility from `--shadow-card`, usable by any future component via normal Tailwind class names. Dark-mode values apply automatically whenever an ancestor element has the `dark` class — no `dark:` prefix needed for these tokens.

- [ ] **Step 1: Replace app/globals.css with the token-bearing version**

Replace the full contents of `app/globals.css` with:

```css
@import "tailwindcss";
@config "../tailwind.config.js";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-text-primary: #182434;
  --color-text-muted: #808080;
  --color-border: #bdc2c7;
  --color-primary: #2a6aa2;
  --color-primary-hover: #1f5480;
  --color-accent-tint: #e7f2fd;
  --color-accent-tint-strong: #cfe6fc;
  --color-button-secondary-bg: #ececec;
  --shadow-card: 0px 4px 24px 0px rgba(0, 0, 0, 0.08);
}

.dark {
  --color-background: #182434;
  --color-surface: #1e2c3f;
  --color-surface-elevated: #24344a;
  --color-text-primary: #ffffff;
  --color-text-muted: #9ba3ac;
  --color-border: #33475e;
  --color-primary: #5ca0e2;
  --color-primary-hover: #2a6aa2;
  --color-accent-tint: #1c3350;
  --color-accent-tint-strong: #24466b;
  --color-button-secondary-bg: #2a3b4f;
  --shadow-card: 0px 4px 24px 0px rgba(0, 0, 0, 0.32);
  color-scheme: dark;
}

:root {
  color-scheme: light;
}

body {
  margin: 0;
}
```

- [ ] **Step 2: Verify the build succeeds**

```bash
npm run build
```

Expected: build completes with no errors (same route list as before — this task only changes CSS, no routes).

- [ ] **Step 3: Verify the light-mode tokens actually generate real utility classes**

```bash
grep -io "2a6aa2" .next/static/css/*.css
```

Expected: at least one match — confirms `--color-primary`'s hex value made it into the compiled CSS (proving Tailwind picked up the `@theme` block and generated a utility referencing it).

- [ ] **Step 4: Verify the dark-mode override block is present in compiled CSS**

```bash
grep -io "\.dark{[^}]*5ca0e2" .next/static/css/*.css
```

Expected: at least one match — confirms the `.dark` selector's `--color-primary: #5ca0e2` override compiled correctly. (Tailwind v4 minifies CSS without spaces, so match on the compact form; if this exact pattern doesn't match due to property ordering, instead run `grep -io "\.dark{" .next/static/css/*.css` and manually inspect the matched block with `grep -A5 "\.dark{" .next/static/css/*.css` to confirm `5ca0e2` appears somewhere inside it.)

- [ ] **Step 5: Verify the shadow-card token compiled**

```bash
grep -io "shadow-card" .next/static/css/*.css
```

Expected: at least one match — confirms Tailwind generated a `.shadow-card` utility class from the `--shadow-card` theme token.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "Add light/dark color design tokens"
```

---

### Task 2: Load Inter font and wire it into Tailwind's font-sans token

**Files:**
- Modify: `app/layout.js`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing from Task 1 directly, but edits the same `app/globals.css` file Task 1 modified — apply this task's changes on top of Task 1's version, don't overwrite Task 1's `@theme`/`.dark` blocks.
- Produces: the `font-sans` Tailwind utility class now resolves to Inter (with system-ui fallback), applied globally via `<body className="font-sans">`.

- [ ] **Step 1: Edit app/layout.js to load Inter and apply it**

Replace the full contents of `app/layout.js` with:

```jsx
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'ESK Packaging',
  description: 'Industrial packaging products storefront.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add the font-sans theme token to app/globals.css**

Edit `app/globals.css` — add a `--font-sans` line inside the existing `@theme { ... }` block from Task 1 (add it as a new line inside that block, alongside the `--color-*` lines, don't create a second `@theme` block):

```css
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
```

- [ ] **Step 3: Verify the build succeeds**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 4: Verify Inter is actually being loaded and applied**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000 -o /tmp/esk-theme-check.html
grep -o '<html[^>]*class="[^"]*"' /tmp/esk-theme-check.html
grep -o '<link rel="preload" as="font"[^>]*>' /tmp/esk-theme-check.html
kill %1
rm /tmp/esk-theme-check.html
```

Expected: the `<html>` tag's `class` attribute contains a `next/font`-generated class (a name starting with `__variable_` or similar hashed pattern — next/font always emits one), AND at least one `<link rel="preload" as="font" ...>` tag appears in the response (next/font auto-preloads the font file it's serving). If the background `npm run start` process is still running after this step for any reason, confirm with `lsof -ti tcp:3000` that port 3000 is free before moving on; if not, kill it.

- [ ] **Step 5: Commit**

```bash
git add app/layout.js app/globals.css
git commit -m "Load Inter font and wire font-sans token"
```

---

### Task 3: Add the app favicon

**Files:**
- Create: `app/icon.png` (copied from `/Users/enesdorukesen/WebstormProjects/ESK_FE_V2/assets/ESK_icon_mini.png`)

**Interfaces:**
- Produces: a favicon served automatically by Next.js's file-based `app/icon.png` convention — no code wiring needed beyond the file's presence.

- [ ] **Step 1: Copy the icon asset into app/**

```bash
cp /Users/enesdorukesen/WebstormProjects/ESK_FE_V2/assets/ESK_icon_mini.png app/icon.png
```

- [ ] **Step 2: Verify the build succeeds and recognizes the icon**

```bash
npm run build
```

Expected: build completes with no errors. Next.js's build output for the root route should not show any warning about a missing/invalid icon file (if `app/icon.png` were malformed, Next.js's build step would error on it).

- [ ] **Step 3: Verify the favicon is actually served and linked**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000 -o /tmp/esk-icon-check.html
ICON_HREF=$(grep -o '<link rel="icon"[^>]*href="[^"]*"' /tmp/esk-icon-check.html | grep -o 'href="[^"]*"' | head -1 | sed 's/href="//;s/"$//')
echo "Found icon href: $ICON_HREF"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000${ICON_HREF}"
kill %1
rm /tmp/esk-icon-check.html
```

Expected: `$ICON_HREF` is non-empty (a `<link rel="icon" ...>` tag was found in the page head, auto-generated by Next.js from `app/icon.png`), and the subsequent curl to that href returns `200`. If the background `npm run start` process is still running after this step, confirm with `lsof -ti tcp:3000` that port 3000 is free; if not, kill it.

- [ ] **Step 4: Commit**

```bash
git add app/icon.png
git commit -m "Add app favicon from brand assets"
```

---

### Task 4: Final verification pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Run the full unit/component test suite**

```bash
npm run test
```

Expected: all existing tests still pass (this plan touches no test files, no store/component logic — should be the same count as before this plan started).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no new errors (the project's 2 pre-existing style warnings on `postcss.config.mjs`/`tailwind.config.js` are unrelated and expected to remain).

- [ ] **Step 3: Run the production build one more time**

```bash
npm run build
```

Expected: success, same route list as before this plan.

- [ ] **Step 4: Manually confirm dark-mode tokens are toggleable via the class (no UI exists yet — this is a raw DOM check)**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000 | grep -o '<body[^>]*class="[^"]*"'
kill %1
```

Expected: the `<body>` tag has a `class` attribute containing `font-sans` (confirms Task 2 wiring is present on every page, not just the ones directly touched). This step doesn't test the `.dark` class itself (no toggle exists yet to add it — that's next phase), it only confirms the font-sans wiring survived through Task 3 unchanged.

- [ ] **Step 5: If everything is clean, there is nothing to commit**

Do NOT create an empty commit. If any step above required a fix, commit exactly that fix with a message describing what verification step caught it.
