# ESK Storefront Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the project skeleton for the new ESK storefront — Next.js app initialization, core dependencies, the auth/data/state foundation (axios refresh interceptor, TanStack Query provider, Zustand stores), UI primitive scaffolding, and empty route files for every page in the design — so that a `npm run dev` boots a navigable (unstyled) site and the next steps (theme, component implementation) have a structure to build into.

**Architecture:** Next.js App Router with three route groups — `(storefront)` public, `(auth)` public, `(account)` client-side-guarded — backed by TanStack Query for server state and Zustand for client state (guest cart, auth user, UI toggles). All auth protection is client-side (`AuthGuard` component) because the API lives on a different domain and cannot be reached by Next.js middleware. No theming or real component implementation happens in this plan — pages render minimal placeholder content only.

**Tech Stack:** Next.js (App Router, JavaScript/JSX, no `src/` dir), Tailwind CSS v4, TanStack Query v5, Zustand, axios, react-hook-form + yup, Radix UI primitives, lucide-react, Stripe React SDK, Vitest + React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-05-esk-storefront-design.md`

## Global Constraints

- All project content (route segments, code, UI copy) is in **English** — no Turkish identifiers or strings in the codebase.
- **JavaScript only** — no TypeScript, no `.ts`/`.tsx` files.
- Next.js **App Router**, project files live at the **repo root** (`/Users/enesdorukesen/WebstormProjects/ESK_FE_V2`) — no `src/` directory, no extra `esk-storefront/` subfolder nesting.
- Auth protection is **client-side only** (`AuthGuard` component) — no `middleware.js` performing auth checks, since the API's auth cookies are not visible to this app's server.
- HTTP layer uses a **single axios instance** with a **queued 401→refresh interceptor** (one in-flight refresh call shared by all concurrent 401s, not one retry per request).
- The server is the pricing authority — no client-side code in this plan computes a final chargeable amount; `lib/pricing.js` is explicitly out of scope for this plan (deferred to the component-implementation step).
- `lib/cdn.js` must normalize CDN URLs so a base with a trailing slash and a path with a leading slash never produce a double slash.
- Canonical image endpoint is `/api/images` (not `/api/r2`) — noted for later tasks, not consumed by this plan.
- Theme tokens, brand colors, fonts, and full component visual design are **out of scope** — placeholder Tailwind utility classes only.
- Component-level implementation (real catalog/cart/checkout logic) is **out of scope** — this plan produces structure and empty/placeholder pages only.

---

## File Structure

```
package.json, next.config.js, jsconfig.json, postcss.config.mjs, tailwind.config.js
.eslintrc.json, .gitignore, .env.example
vitest.config.js, vitest.setup.js, playwright.config.js

app/
  layout.js, providers.js, globals.css
  (storefront)/layout.js, page.js
    category/[categorySlug]/page.js
    category/[categorySlug]/[subcategorySlug]/page.js
    product/[productSlug]/[variantId]/page.js
    search/page.js
    cart/page.js
    checkout/page.js
    order-confirmation/[orderNumber]/page.js
    support/page.js
  (auth)/
    login/page.js
    register/page.js
    forgot-password/page.js
    reset-password/[token]/page.js
  (account)/
    layout.js
    account/page.js
    account/orders/page.js
    account/orders/[orderNumber]/page.js
    account/addresses/page.js
    account/invoices/page.js

components/
  ui/Button.jsx, ui/Button.test.jsx
  ui/Modal.jsx, ui/Modal.test.jsx
  layout/AuthGuard.js, layout/AuthGuard.test.jsx

lib/
  refreshQueue.js, refreshQueue.test.js
  api.js
  cdn.js, cdn.test.js

stores/
  cartStore.js, cartStore.test.js
  authStore.js, authStore.test.js
  uiStore.js, uiStore.test.js

tests/e2e/home.spec.js
```

---

### Task 1: Initialize the Next.js project

**Files:**
- Create: `package.json`, `next.config.js`, `jsconfig.json`, `.eslintrc.json`, `.gitignore`
- Create: `app/layout.js`, `app/page.js`, `app/globals.css`

**Interfaces:**
- Produces: a running Next.js app (`npm run dev` serves `/`), `@/*` import alias resolving to the repo root.

- [ ] **Step 1: Initialize package.json and install Next.js/React**

```bash
npm init -y
npm install next@latest react@latest react-dom@latest
```

- [ ] **Step 2: Edit package.json scripts and metadata**

Edit `package.json` — set `"name": "esk-storefront"`, `"private": true`, and replace the `"scripts"` block with:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create jsconfig.json for the @/ import alias**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.next/
out/
.env
.env.local
test-results/
playwright-report/
coverage/
```

- [ ] **Step 6: Create the root app files**

`app/globals.css`:

```css
:root {
  color-scheme: light;
}

body {
  margin: 0;
}
```

`app/layout.js`:

```jsx
import './globals.css';

export const metadata = {
  title: 'ESK Packaging',
  description: 'Industrial packaging products storefront.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.js`:

```jsx
export default function HomePage() {
  return (
    <main>
      <h1>ESK Packaging</h1>
      <p>Storefront scaffold — home page placeholder.</p>
    </main>
  );
}
```

- [ ] **Step 7: Install and configure ESLint for Next.js**

```bash
npm install --save-dev eslint eslint-config-next
```

Create `.eslintrc.json`:

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 8: Verify the app builds and boots**

```bash
npm run build
```

Expected: build completes with no errors, `/` listed as a static route.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json next.config.js jsconfig.json .eslintrc.json .gitignore app/
git commit -m "Initialize Next.js app scaffold"
```

---

### Task 2: Tailwind CSS v4 setup

**Files:**
- Create: `postcss.config.mjs`, `tailwind.config.js`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `app/globals.css` from Task 1.
- Produces: Tailwind utility classes available in all components going forward.

- [ ] **Step 1: Install Tailwind v4**

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

- [ ] **Step 2: Create postcss.config.mjs**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 3: Create tailwind.config.js (empty theme, ready for brand tokens later)**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 4: Replace app/globals.css contents**

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  margin: 0;
}
```

- [ ] **Step 5: Use a Tailwind utility class in app/page.js to confirm it's wired up**

Edit `app/page.js`:

```jsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">ESK Packaging</h1>
      <p className="text-slate-600">Storefront scaffold — home page placeholder.</p>
    </main>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: build succeeds; no PostCSS/Tailwind errors.

- [ ] **Step 7: Commit**

```bash
git add postcss.config.mjs tailwind.config.js app/globals.css app/page.js
git commit -m "Add Tailwind CSS v4"
```

---

### Task 3: Core dependencies and app providers

**Files:**
- Create: `app/providers.js`
- Modify: `app/layout.js`

**Interfaces:**
- Produces: `<Providers>` component (wraps children in `QueryClientProvider`) importable from `@/app/providers` and used by every page.

- [ ] **Step 1: Install data/state/form/UI dependencies**

```bash
npm install @tanstack/react-query zustand axios react-hook-form yup @hookform/resolvers lucide-react
npm install @stripe/react-stripe-js @stripe/stripe-js
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-accordion @radix-ui/react-toast
```

- [ ] **Step 2: Create app/providers.js**

```jsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Wire Providers into the root layout**

Edit `app/layout.js`:

```jsx
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'ESK Packaging',
  description: 'Industrial packaging products storefront.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/providers.js app/layout.js
git commit -m "Add TanStack Query provider and core dependencies"
```

---

### Task 4: Vitest test tooling

**Files:**
- Create: `vitest.config.js`, `vitest.setup.js`

**Interfaces:**
- Produces: `npm run test` runs Vitest with jsdom + Testing Library matchers available to every `*.test.js`/`*.test.jsx` file used by later tasks.

- [ ] **Step 1: Install Vitest and Testing Library**

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Create vitest.setup.js**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Write a throwaway smoke test to verify the runner works**

Create `lib/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

```bash
npx vitest run
```

Expected: 1 passed test.

- [ ] **Step 6: Delete the smoke test**

```bash
rm lib/smoke.test.js
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.js vitest.setup.js
git commit -m "Add Vitest and Testing Library tooling"
```

---

### Task 5: lib/refreshQueue.js — dedup concurrent token-refresh calls

**Files:**
- Create: `lib/refreshQueue.js`
- Test: `lib/refreshQueue.test.js`

**Interfaces:**
- Produces: `createRefreshQueue(refreshFn)` returning `{ getRefreshPromise }`, consumed by `lib/api.js` in Task 6.

- [ ] **Step 1: Write the failing test**

Create `lib/refreshQueue.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { createRefreshQueue } from './refreshQueue';

describe('createRefreshQueue', () => {
  it('dedupes concurrent calls into a single underlying refresh call', async () => {
    let resolveRefresh;
    const refreshFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );
    const { getRefreshPromise } = createRefreshQueue(refreshFn);

    const p1 = getRefreshPromise();
    const p2 = getRefreshPromise();
    const p3 = getRefreshPromise();

    expect(refreshFn).toHaveBeenCalledTimes(1);

    resolveRefresh();
    await Promise.all([p1, p2, p3]);

    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('starts a new underlying call after the previous one resolves', async () => {
    const refreshFn = vi.fn(() => Promise.resolve());
    const { getRefreshPromise } = createRefreshQueue(refreshFn);

    await getRefreshPromise();
    await getRefreshPromise();

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('lets a rejected refresh propagate to all waiters and clears state for the next call', async () => {
    const refreshFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce(undefined);
    const { getRefreshPromise } = createRefreshQueue(refreshFn);

    await expect(Promise.all([getRefreshPromise(), getRefreshPromise()])).rejects.toThrow(
      'refresh failed'
    );

    await expect(getRefreshPromise()).resolves.toBeUndefined();
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/refreshQueue.test.js
```

Expected: FAIL — `lib/refreshQueue.js` does not exist / `createRefreshQueue` is not defined.

- [ ] **Step 3: Implement lib/refreshQueue.js**

```js
export function createRefreshQueue(refreshFn) {
  let inFlight = null;

  function getRefreshPromise() {
    if (!inFlight) {
      inFlight = refreshFn().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }

  return { getRefreshPromise };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run lib/refreshQueue.test.js
```

Expected: 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add lib/refreshQueue.js lib/refreshQueue.test.js
git commit -m "Add refresh-queue dedup helper for 401 handling"
```

---

### Task 6: lib/api.js — single axios instance with queued refresh interceptor

**Files:**
- Create: `lib/api.js`

**Interfaces:**
- Consumes: `createRefreshQueue` from `lib/refreshQueue.js` (Task 5).
- Produces: `api` (axios instance, `withCredentials: true`, base URL from `NEXT_PUBLIC_API_URL`), the default export used by every future data-fetching hook.

- [ ] **Step 1: Create .env.example with the API URL var (needed for lib/api.js to have something to read)**

Create `.env.example`:

```
NEXT_PUBLIC_API_URL=https://eskapi-production.up.railway.app/api
NEXT_PUBLIC_CDN_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

- [ ] **Step 2: Implement lib/api.js**

```js
import axios from 'axios';
import { createRefreshQueue } from './refreshQueue';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const { getRefreshPromise } = createRefreshQueue(() =>
  axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true })
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      await getRefreshPromise();
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

- [ ] **Step 3: Verify the project still builds**

```bash
npm run build
```

Expected: build succeeds (module isn't consumed yet, so this just checks for syntax errors).

- [ ] **Step 4: Commit**

```bash
git add lib/api.js .env.example
git commit -m "Add axios client with queued 401 refresh interceptor"
```

---

### Task 7: lib/cdn.js — normalize R2/CDN image URLs

**Files:**
- Create: `lib/cdn.js`
- Test: `lib/cdn.test.js`

**Interfaces:**
- Produces: `resolveImageUrl(path)`, used later by any component rendering a product/variant image.

- [ ] **Step 1: Write the failing test**

Create `lib/cdn.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveImageUrl } from './cdn';

describe('resolveImageUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('joins a CDN base with a trailing slash and a path with a leading slash without doubling the slash', () => {
    expect(resolveImageUrl('/images/box.png')).toBe(
      'https://cdn.eskpackaging.com/images/box.png'
    );
  });

  it('joins a path with no leading slash', () => {
    expect(resolveImageUrl('images/box.png')).toBe(
      'https://cdn.eskpackaging.com/images/box.png'
    );
  });

  it('passes through already-absolute URLs unchanged', () => {
    expect(resolveImageUrl('https://other-host.com/x.png')).toBe(
      'https://other-host.com/x.png'
    );
  });

  it('returns null for a nullish path', () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl(undefined)).toBeNull();
    expect(resolveImageUrl('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/cdn.test.js
```

Expected: FAIL — `lib/cdn.js` does not exist.

- [ ] **Step 3: Implement lib/cdn.js**

```js
export function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');

  return `${base}/${cleanPath}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run lib/cdn.test.js
```

Expected: 4 passed tests.

- [ ] **Step 5: Commit**

```bash
git add lib/cdn.js lib/cdn.test.js
git commit -m "Add CDN image URL normalizer"
```

---

### Task 8: stores/cartStore.js — guest cart (Zustand + persist)

**Files:**
- Create: `stores/cartStore.js`
- Test: `stores/cartStore.test.js`

**Interfaces:**
- Produces: `useCartStore` hook with state `{ items }` (`items: { variantId, quantity, isPallet }[]`) and actions `addItem(variantId, quantity, isPallet)`, `removeItem(variantId, isPallet)`, `updateQuantity(variantId, quantity, isPallet)`, `clear()`.

- [ ] **Step 1: Write the failing test**

Create `stores/cartStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('adds a new item', () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    expect(useCartStore.getState().items).toEqual([
      { variantId: 'variant-1', quantity: 2, isPallet: false },
    ]);
  });

  it('increments quantity when adding the same variant/isPallet combination again', () => {
    useCartStore.getState().addItem('variant-1', 2, false);
    useCartStore.getState().addItem('variant-1', 3, false);
    expect(useCartStore.getState().items).toEqual([
      { variantId: 'variant-1', quantity: 5, isPallet: false },
    ]);
  });

  it('treats the same variant as a separate line when isPallet differs', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().addItem('variant-1', 1, true);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('updates quantity for a specific line', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().updateQuantity('variant-1', 9, false);
    expect(useCartStore.getState().items[0].quantity).toBe(9);
  });

  it('removes a specific line', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().addItem('variant-2', 1, false);
    useCartStore.getState().removeItem('variant-1', false);
    expect(useCartStore.getState().items).toEqual([
      { variantId: 'variant-2', quantity: 1, isPallet: false },
    ]);
  });

  it('clears all items', () => {
    useCartStore.getState().addItem('variant-1', 1, false);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run stores/cartStore.test.js
```

Expected: FAIL — `stores/cartStore.js` does not exist.

- [ ] **Step 3: Implement stores/cartStore.js**

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],

      addItem: (variantId, quantity = 1, isPallet = false) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.variantId === variantId && item.isPallet === isPallet
          );

          if (existingIndex === -1) {
            return { items: [...state.items, { variantId, quantity, isPallet }] };
          }

          const items = [...state.items];
          items[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + quantity,
          };
          return { items };
        }),

      removeItem: (variantId, isPallet = false) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.variantId === variantId && item.isPallet === isPallet)
          ),
        })),

      updateQuantity: (variantId, quantity, isPallet = false) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId && item.isPallet === isPallet
              ? { ...item, quantity }
              : item
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: 'esk-guest-cart' }
  )
);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run stores/cartStore.test.js
```

Expected: 6 passed tests.

- [ ] **Step 5: Commit**

```bash
git add stores/cartStore.js stores/cartStore.test.js
git commit -m "Add guest cart Zustand store"
```

---

### Task 9: stores/authStore.js and stores/uiStore.js

**Files:**
- Create: `stores/authStore.js`, `stores/uiStore.js`
- Test: `stores/authStore.test.js`, `stores/uiStore.test.js`

**Interfaces:**
- Produces: `useAuthStore` (`{ user, isLoading }` + `setUser(user)`, `clearUser()`), consumed by `AuthGuard` in Task 13.
- Produces: `useUIStore` (`{ isCartDrawerOpen, isMobileNavOpen }` + `openCartDrawer()`, `closeCartDrawer()`, `toggleMobileNav()`, `closeMobileNav()`), consumed by header/layout components in a later step.

- [ ] **Step 1: Write the failing tests**

Create `stores/authStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it('starts with isLoading true and no user', () => {
    expect(useAuthStore.getState()).toMatchObject({ user: null, isLoading: true });
  });

  it('setUser stores the user and clears isLoading', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com' });
    expect(useAuthStore.getState()).toEqual({
      user: { id: '1', email: 'a@b.com' },
      isLoading: false,
      setUser: expect.any(Function),
      clearUser: expect.any(Function),
    });
  });

  it('clearUser resets the user and clears isLoading', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com' });
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
```

Create `stores/uiStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ isCartDrawerOpen: false, isMobileNavOpen: false });
  });

  it('opens and closes the cart drawer', () => {
    useUIStore.getState().openCartDrawer();
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
    useUIStore.getState().closeCartDrawer();
    expect(useUIStore.getState().isCartDrawerOpen).toBe(false);
  });

  it('toggles and closes the mobile nav', () => {
    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(true);
    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);
    useUIStore.getState().toggleMobileNav();
    useUIStore.getState().closeMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run stores/authStore.test.js stores/uiStore.test.js
```

Expected: FAIL — neither store file exists yet.

- [ ] **Step 3: Implement stores/authStore.js**

```js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
}));
```

- [ ] **Step 4: Implement stores/uiStore.js**

```js
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isCartDrawerOpen: false,
  isMobileNavOpen: false,

  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
}));
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run stores/authStore.test.js stores/uiStore.test.js
```

Expected: 5 passed tests.

- [ ] **Step 6: Commit**

```bash
git add stores/authStore.js stores/authStore.test.js stores/uiStore.js stores/uiStore.test.js
git commit -m "Add auth and UI Zustand stores"
```

---

### Task 10: components/ui/Button.jsx

**Files:**
- Create: `components/ui/Button.jsx`
- Test: `components/ui/Button.test.jsx`

**Interfaces:**
- Produces: `<Button variant="primary" | "secondary" | "outline">`, used by every later page/component.

- [ ] **Step 1: Write the failing test**

Create `components/ui/Button.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Install user-event and run the test to verify it fails**

```bash
npm install --save-dev @testing-library/user-event
npx vitest run components/ui/Button.test.jsx
```

Expected: FAIL — `components/ui/Button.jsx` does not exist.

- [ ] **Step 3: Implement components/ui/Button.jsx**

```jsx
const VARIANT_CLASSES = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 text-slate-900 hover:bg-slate-50',
};

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run components/ui/Button.test.jsx
```

Expected: 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json components/ui/Button.jsx components/ui/Button.test.jsx
git commit -m "Add Button UI primitive"
```

---

### Task 11: components/ui/Modal.jsx (Radix Dialog wrapper)

**Files:**
- Create: `components/ui/Modal.jsx`
- Test: `components/ui/Modal.test.jsx`

**Interfaces:**
- Produces: `<Modal open title onOpenChange>` wrapping `@radix-ui/react-dialog`, used by later cart-drawer/confirm-dialog components.

- [ ] **Step 1: Write the failing test**

Create `components/ui/Modal.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders the title and children when open', () => {
    render(
      <Modal open title="Confirm" onOpenChange={() => {}}>
        <p>Are you sure?</p>
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <Modal open={false} title="Confirm" onOpenChange={() => {}}>
        <p>Are you sure?</p>
      </Modal>
    );
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run components/ui/Modal.test.jsx
```

Expected: FAIL — `components/ui/Modal.jsx` does not exist.

- [ ] **Step 3: Implement components/ui/Modal.jsx**

```jsx
import * as Dialog from '@radix-ui/react-dialog';

export function Modal({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run components/ui/Modal.test.jsx
```

Expected: 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Modal.jsx components/ui/Modal.test.jsx
git commit -m "Add Modal UI primitive"
```

---

### Task 12: (storefront) route group — public pages

**Files:**
- Create: `app/(storefront)/layout.js`, `app/(storefront)/page.js`
- Create: `app/(storefront)/category/[categorySlug]/page.js`
- Create: `app/(storefront)/category/[categorySlug]/[subcategorySlug]/page.js`
- Create: `app/(storefront)/product/[productSlug]/[variantId]/page.js`
- Create: `app/(storefront)/search/page.js`
- Create: `app/(storefront)/cart/page.js`
- Create: `app/(storefront)/checkout/page.js`
- Create: `app/(storefront)/order-confirmation/[orderNumber]/page.js`
- Create: `app/(storefront)/support/page.js`
- Modify: `app/page.js` (deleted — home now lives at `app/(storefront)/page.js`)

**Interfaces:**
- Produces: every public storefront route, all rendering placeholder content, reachable via `npm run dev`.

- [ ] **Step 1: Move the home page into the (storefront) route group**

```bash
mkdir -p "app/(storefront)"
git mv app/page.js "app/(storefront)/page.js"
```

Edit `app/(storefront)/page.js` to keep it as the home page placeholder (content unchanged from Task 2's version).

- [ ] **Step 2: Create app/(storefront)/layout.js**

```jsx
export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 p-4">
        <p className="font-semibold">ESK Packaging</p>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-slate-200 p-4 text-sm text-slate-500">
        © ESK Packaging
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Create the category pages**

`app/(storefront)/category/[categorySlug]/page.js`:

```jsx
export default function CategoryPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Category: {params.categorySlug}</h1>
      <p className="text-slate-600">Subcategory/product listing placeholder.</p>
    </main>
  );
}
```

`app/(storefront)/category/[categorySlug]/[subcategorySlug]/page.js`:

```jsx
export default function SubcategoryPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">
        {params.categorySlug} / {params.subcategorySlug}
      </h1>
      <p className="text-slate-600">Product grid placeholder.</p>
    </main>
  );
}
```

- [ ] **Step 4: Create the product detail page**

`app/(storefront)/product/[productSlug]/[variantId]/page.js`:

```jsx
export default function ProductVariantPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{params.productSlug}</h1>
      <p className="text-slate-600">Variant {params.variantId} detail placeholder.</p>
    </main>
  );
}
```

- [ ] **Step 5: Create search, cart, checkout, order-confirmation, support pages**

`app/(storefront)/search/page.js`:

```jsx
export default function SearchPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Search</h1>
      <p className="text-slate-600">Search results placeholder.</p>
    </main>
  );
}
```

`app/(storefront)/cart/page.js`:

```jsx
export default function CartPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Cart</h1>
      <p className="text-slate-600">Cart contents placeholder.</p>
    </main>
  );
}
```

`app/(storefront)/checkout/page.js`:

```jsx
export default function CheckoutPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="text-slate-600">Address, shipping, and payment placeholder.</p>
    </main>
  );
}
```

`app/(storefront)/order-confirmation/[orderNumber]/page.js`:

```jsx
export default function OrderConfirmationPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Order {params.orderNumber} confirmed</h1>
      <p className="text-slate-600">Order confirmation placeholder.</p>
    </main>
  );
}
```

`app/(storefront)/support/page.js`:

```jsx
export default function SupportPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Support</h1>
      <p className="text-slate-600">Claim submission form placeholder.</p>
    </main>
  );
}
```

- [ ] **Step 6: Verify the app builds and routes are listed**

```bash
npm run build
```

Expected: build succeeds; route list includes `/`, `/category/[categorySlug]`, `/category/[categorySlug]/[subcategorySlug]`, `/product/[productSlug]/[variantId]`, `/search`, `/cart`, `/checkout`, `/order-confirmation/[orderNumber]`, `/support`.

- [ ] **Step 7: Commit**

```bash
git add "app/(storefront)"
git commit -m "Add storefront public route group with placeholder pages"
```

---

### Task 13: (auth) route group and AuthGuard

**Files:**
- Create: `app/(auth)/login/page.js`, `app/(auth)/register/page.js`, `app/(auth)/forgot-password/page.js`, `app/(auth)/reset-password/[token]/page.js`
- Create: `components/layout/AuthGuard.js`
- Test: `components/layout/AuthGuard.test.jsx`

**Interfaces:**
- Consumes: `useAuthStore` from `stores/authStore.js` (Task 9).
- Produces: `<AuthGuard>` component (redirects to `/login` when `user` is `null` and `isLoading` is `false`; renders nothing while `isLoading` is `true`; renders children when `user` is present), used by `app/(account)/layout.js` in Task 14.

- [ ] **Step 1: Create the public auth pages**

`app/(auth)/login/page.js`:

```jsx
export default function LoginPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="text-slate-600">Login form placeholder.</p>
    </main>
  );
}
```

`app/(auth)/register/page.js`:

```jsx
export default function RegisterPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="text-slate-600">Registration form placeholder.</p>
    </main>
  );
}
```

`app/(auth)/forgot-password/page.js`:

```jsx
export default function ForgotPasswordPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="text-slate-600">Password reset request form placeholder.</p>
    </main>
  );
}
```

`app/(auth)/reset-password/[token]/page.js`:

```jsx
export default function ResetPasswordPage({ params }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-slate-600">Reset form placeholder for token {params.token}.</p>
    </main>
  );
}
```

- [ ] **Step 2: Write the failing test for AuthGuard**

Create `components/layout/AuthGuard.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

import { AuthGuard } from './AuthGuard';

describe('AuthGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it('renders nothing while auth state is loading', () => {
    useAuthStore.setState({ user: null, isLoading: true });
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects to /login when not loading and there is no user', () => {
    useAuthStore.setState({ user: null, isLoading: false });
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    );
    expect(replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when a user is present', () => {
    useAuthStore.setState({ user: { id: '1' }, isLoading: false });
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run components/layout/AuthGuard.test.jsx
```

Expected: FAIL — `components/layout/AuthGuard.js` does not exist.

- [ ] **Step 4: Implement components/layout/AuthGuard.js**

```jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function AuthGuard({ children }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return children;
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run components/layout/AuthGuard.test.jsx
```

Expected: 3 passed tests.

- [ ] **Step 6: Verify the app builds**

```bash
npm run build
```

Expected: build succeeds; route list includes `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)" components/layout/AuthGuard.js components/layout/AuthGuard.test.jsx
git commit -m "Add auth route group and client-side AuthGuard"
```

---

### Task 14: (account) route group — guarded pages

**Files:**
- Create: `app/(account)/layout.js`
- Create: `app/(account)/account/page.js`, `app/(account)/account/orders/page.js`, `app/(account)/account/orders/[orderNumber]/page.js`, `app/(account)/account/addresses/page.js`, `app/(account)/account/invoices/page.js`

**Interfaces:**
- Consumes: `AuthGuard` from `components/layout/AuthGuard.js` (Task 13).
- Produces: every account route, all wrapped by `AuthGuard`.

- [ ] **Step 1: Create app/(account)/layout.js**

```jsx
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function AccountLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 p-4">
          <p className="font-semibold">My Account</p>
        </header>
        <div className="flex-1 p-8">{children}</div>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Create the account pages**

`app/(account)/account/page.js`:

```jsx
export default function AccountOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Account overview</h1>
      <p className="text-slate-600">Account summary placeholder.</p>
    </div>
  );
}
```

`app/(account)/account/orders/page.js`:

```jsx
export default function AccountOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Order history</h1>
      <p className="text-slate-600">Order list placeholder.</p>
    </div>
  );
}
```

`app/(account)/account/orders/[orderNumber]/page.js`:

```jsx
export default function AccountOrderDetailPage({ params }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Order {params.orderNumber}</h1>
      <p className="text-slate-600">Order detail placeholder.</p>
    </div>
  );
}
```

`app/(account)/account/addresses/page.js`:

```jsx
export default function AccountAddressesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Address book</h1>
      <p className="text-slate-600">Saved addresses placeholder.</p>
    </div>
  );
}
```

`app/(account)/account/invoices/page.js`:

```jsx
export default function AccountInvoicesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <p className="text-slate-600">Invoice list placeholder.</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify the app builds**

```bash
npm run build
```

Expected: build succeeds; route list includes `/account`, `/account/orders`, `/account/orders/[orderNumber]`, `/account/addresses`, `/account/invoices`.

- [ ] **Step 4: Commit**

```bash
git add "app/(account)"
git commit -m "Add account route group guarded by AuthGuard"
```

---

### Task 15: Playwright e2e smoke test

**Files:**
- Create: `playwright.config.js`, `tests/e2e/home.spec.js`

**Interfaces:**
- Produces: `npm run test:e2e` boots the dev server and verifies the home page renders.

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create playwright.config.js**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

- [ ] **Step 3: Write the e2e smoke test**

Create `tests/e2e/home.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('home page renders the storefront heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ESK Packaging' })).toBeVisible();
});
```

- [ ] **Step 4: Run it**

```bash
npm run test:e2e
```

Expected: 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.js tests/e2e/home.spec.js
git commit -m "Add Playwright e2e smoke test"
```

---

### Task 16: Final verification pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Run the full unit/component test suite**

```bash
npm run test
```

Expected: all tests pass (refreshQueue, cdn, cartStore, authStore, uiStore, Button, Modal, AuthGuard).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors. Fix any that appear before proceeding.

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

Expected: build succeeds, full route list printed matches the File Structure section above.

- [ ] **Step 4: Run the e2e suite once more against the fresh build**

```bash
npm run test:e2e
```

Expected: 1 passed test.

- [ ] **Step 5: Manually boot the dev server and click through the routes**

```bash
npm run dev
```

Visit `/`, `/category/test`, `/category/test/sub`, `/product/test/1`, `/search`, `/cart`, `/checkout`, `/order-confirmation/1`, `/support`, `/login`, `/register`, `/forgot-password`, `/reset-password/token`, `/account` (should redirect to `/login` since no user is set). Stop the server (Ctrl+C) when done.

- [ ] **Step 6: Commit any fixes from this pass**

If lint or build produced fixes:

```bash
git add -A
git commit -m "Fix lint/build issues found in scaffold verification pass"
```

If nothing needed fixing, skip this commit — the scaffold is complete.
