# Product Page Density Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a product's price/quantity/Add to Cart action reachable while a buyer scrolls through its specs, on both desktop (sticky right column) and mobile (a bottom sticky bar that appears once the real button scrolls away), and surface the spec table earlier in the page.

**Architecture:** `StickyBuyBar` is a new, self-contained presentational component: it owns an `IntersectionObserver` watching a DOM ref it's handed, and renders a fixed bottom bar only once that target has scrolled out of view, with no state of its own beyond that visibility flag. `ProductView.js` keeps owning all real purchase state (`quantity`, `isPallet`, `handleAddToCart`) exactly as it does today, and threads a ref to its own real "Add to Cart" button plus a formatted price string down into `StickyBuyBar` as props — the bar never duplicates or re-derives that state. The desktop sticky behavior needs no new component: it's a Tailwind class change on `ProductView`'s existing right-column wrapper. The spec-table move is a JSX reordering inside that same wrapper.

**Tech Stack:** Next.js, Tailwind, Vitest + React Testing Library + `@testing-library/user-event` (matching `components/catalog/ProductView.test.jsx`'s existing conventions).

**Spec:** `docs/superpowers/specs/2026-11-01-product-page-density-rework.md`

## Global Constraints

- The mobile sticky bar has no quantity control — a buyer who wants to change quantity scrolls up to the real control. Do not add one.
- `StickyBuyBar` must reuse `ProductView`'s existing `handleAddToCart`/`quantity`/`isPallet` state via props. It must never hold its own quantity state.
- The spec-table reordering (specs above description/bullets) applies on both desktop and mobile — it is not wrapped in a `lg:`-conditional.
- The `lg:top-32` estimate for the sticky column's offset is derived from `Header`'s and `Navbar`'s own fixed-height classes, not measured at runtime. No task in this plan can verify the real pixel value against a running browser — flagged in Review Focus below as a standing manual-verification item, not something any task's tests can close.

## Review Focus

- A variant with an empty `priceTiers` array (`variant.priceTiers[0]` is `undefined`) must not crash the page when building the sticky bar's price label — `ProductView` must guard this, not assume a tier always exists.
- `StickyBuyBar`'s effect must not throw if `targetRef.current` is `null` when it runs (e.g., called before the real button has mounted) — it should simply do nothing rather than call `.observe(null)`.
- Unmounting `StickyBuyBar` (e.g. navigating to a different product) while its observer is active must disconnect it cleanly — no leaked observer, no error on unmount.
- The sticky classes must land on the right column's own wrapper div, never on the shared two-column grid container — the grid itself (and therefore the left/gallery column) must keep scrolling normally. A test must assert the grid container itself does *not* carry the sticky classes, not just that some descendant does.
- Real-browser verification that `lg:top-32` doesn't overlap or gap under the actual rendered `Header`+`Navbar` stack cannot be performed by any test in this environment (no browser tool available this session) — this stays an explicit, carried-forward manual-verification requirement; no task below claims to close it.

---

## Task 1: `StickyBuyBar` component

**Files:**
- Create: `components/catalog/StickyBuyBar.js`
- Create: `components/catalog/StickyBuyBar.test.jsx`

**Interfaces:**
- Produces: `StickyBuyBar({ targetRef, priceLabel, onAddToCart })` — a React component. `targetRef` is a ref object (`{ current: Element | null }`) pointing at the real, in-flow "Add to Cart" button to watch; `priceLabel` is a pre-formatted string (e.g. `"$68.00"`) or `null`; `onAddToCart` is a no-argument callback. Renders `null` while the watched target is still intersecting the viewport (or before the ref has a target at all), and a fixed bottom bar once it isn't. Consumed by Task 2.

- [ ] **Step 1: Write the failing tests**

Create `components/catalog/StickyBuyBar.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StickyBuyBar } from './StickyBuyBar';

let observerCallback;
let disconnectSpy;
let observeSpy;

beforeEach(() => {
  disconnectSpy = vi.fn();
  observeSpy = vi.fn();
  global.IntersectionObserver = vi.fn((callback) => {
    observerCallback = callback;
    return { observe: observeSpy, disconnect: disconnectSpy };
  });
});

afterEach(() => {
  delete global.IntersectionObserver;
});

function renderWithTarget(overrides = {}) {
  const targetRef = { current: document.createElement('button') };
  const onAddToCart = vi.fn();
  const utils = render(
    <StickyBuyBar
      targetRef={targetRef}
      priceLabel="$68.00"
      onAddToCart={onAddToCart}
      {...overrides}
    />
  );
  return { ...utils, onAddToCart, targetRef };
}

describe('StickyBuyBar', () => {
  it('renders nothing while the real Add to Cart button is still on-screen', () => {
    renderWithTarget();
    act(() => observerCallback([{ isIntersecting: true }]));
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument();
  });

  it('becomes visible once the real button scrolls out of view', () => {
    renderWithTarget();
    act(() => observerCallback([{ isIntersecting: false }]));
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
    expect(screen.getByText('$68.00')).toBeInTheDocument();
  });

  it('calls onAddToCart when clicked, with no quantity control of its own', async () => {
    const { onAddToCart } = renderWithTarget();
    act(() => observerCallback([{ isIntersecting: false }]));

    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('does not throw and observes nothing when targetRef has no current element', () => {
    const targetRef = { current: null };
    expect(() =>
      render(<StickyBuyBar targetRef={targetRef} priceLabel="$68.00" onAddToCart={vi.fn()} />)
    ).not.toThrow();
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('disconnects its observer on unmount', () => {
    const { unmount } = renderWithTarget();
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/StickyBuyBar.test.jsx`
Expected: FAIL — `components/catalog/StickyBuyBar.js` doesn't exist yet (`Cannot find module './StickyBuyBar'` or equivalent resolution error).

- [ ] **Step 3: Implement**

Create `components/catalog/StickyBuyBar.js`:

```jsx
'use client';

import { useEffect, useState } from 'react';

// Mirrors the in-flow "Add to Cart" button on mobile once it scrolls out
// of view. Watches `targetRef` (that real button) via IntersectionObserver
// rather than a scroll-position threshold, so it tracks the button's
// actual on-screen state regardless of page length or viewport size, and
// never shows up while the real button is still reachable.
export function StickyBuyBar({ targetRef, priceLabel, onAddToCart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface px-4 py-3 shadow-card lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-text-primary">{priceLabel}</span>
        <button
          type="button"
          onClick={onAddToCart}
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/StickyBuyBar.test.jsx`
Expected: PASS — all 5 cases green.

- [ ] **Step 5: Commit**

```bash
git add components/catalog/StickyBuyBar.js components/catalog/StickyBuyBar.test.jsx
git commit -m "Add StickyBuyBar: mobile sticky Add to Cart once the real button scrolls away"
```

---

## Task 2: Wire `StickyBuyBar` into `ProductView`, make the buy box sticky, move specs up

**Files:**
- Modify: `components/catalog/ProductView.js` (several non-contiguous spots in the current ~243-line file: the import line, the `useState` block around line 48-50, the `hasPalletPrice` line around line 80, the right-column JSX block currently spanning roughly lines 137-221, and the insertion point right after the `</main>` closing tag around line 223 — each given in full below, in file order)
- Modify: `components/catalog/ProductView.test.jsx`

**Interfaces:**
- Consumes: `StickyBuyBar({ targetRef, priceLabel, onAddToCart })` (Task 1).
- Produces: nothing new for later tasks — this is the plan's last task.

- [ ] **Step 1: Write the failing tests**

In `components/catalog/ProductView.test.jsx`, add the import and mock for `StickyBuyBar` near the top (after the existing `vi.mock` calls):

```js
import { StickyBuyBar } from './StickyBuyBar';
```

```js
vi.mock('./StickyBuyBar', () => ({
  StickyBuyBar: vi.fn(() => null),
}));
```

Add these test cases inside the existing `describe('ProductView', ...)` block, after the last existing `it(...)`:

```jsx
  it('keeps the buy box sticky on desktop without making the whole grid sticky', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const buyBox = screen.getByTestId('product-buy-box');
    expect(buyBox).toHaveClass('lg:sticky', 'lg:top-32', 'lg:self-start');

    const grid = buyBox.parentElement;
    expect(grid.className).not.toMatch(/lg:sticky/);
  });

  it('renders the spec groups above the description and the bullets', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const specHeading = screen.getByText('Material & Performance');
    const description = screen.getByText('A strap.');
    const bullet = screen.getByText('Strong');

    expect(
      specHeading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      specHeading.compareDocumentPosition(bullet) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('wires the mobile sticky bar to the first price tier, the real button, and the add-to-cart handler', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const props = StickyBuyBar.mock.calls[0][0];
    expect(props.priceLabel).toBe('$68.00');
    expect(typeof props.onAddToCart).toBe('function');
    expect(props.targetRef.current).toBe(screen.getByRole('button', { name: 'Add to Cart' }));
  });

  it('passes a null priceLabel to the sticky bar instead of crashing when a variant has no price tiers', () => {
    useVariant.mockReturnValue({
      data: { ...baseVariant, priceTiers: [] },
      isLoading: false,
      isError: false,
    });
    expect(() => render(<ProductView variantId="327" />)).not.toThrow();

    const props = StickyBuyBar.mock.calls[0][0];
    expect(props.priceLabel).toBeNull();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: FAIL on the four new cases — `getByTestId('product-buy-box')` finds nothing yet, the spec heading is not yet positioned before the description/bullet, and `StickyBuyBar` (the mock) is never called because `ProductView.js` doesn't render it yet.

- [ ] **Step 3: Implement**

In `components/catalog/ProductView.js`:

Add the import (alongside the existing relative imports):

```js
import { StickyBuyBar } from './StickyBuyBar';
```

Add `useRef` to the existing React import:

```js
import { useMemo, useRef, useState } from 'react';
```

Inside the component, after the existing `useState` calls, add the ref and the price label:

```js
  const addToCartButtonRef = useRef(null);
```

Immediately after the line `const hasPalletPrice = variant.priceTiers.some((tier) => tier.label === 'Full pallet');`, add:

```js
  const firstTier = variant.priceTiers[0];
  const stickyPriceLabel = firstTier ? `$${firstTier.price.toFixed(2)}` : null;
```

Replace the right-column `<div>` (currently starting at `<div>` right after the closing `</div>` of the image column, and running through the closing `</div>` right before `</div>\n      </main>`) with this reordered, sticky, ref-wired version:

```jsx
        <div data-testid="product-buy-box" className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            {ancestors[0]?.name ?? node?.name ?? 'Product'}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-text-primary md:text-3xl">
            {variant.title}
          </h1>
          {variant.sku && (
            <p className="mt-1 text-sm text-text-muted">SKU: {variant.sku}</p>
          )}

          <PriceTiers tiers={variant.priceTiers} />

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="quantity" className="text-sm font-medium text-text-primary">
                Quantity
              </label>
              <QuantityInput
                id="quantity"
                value={quantity}
                onChange={setQuantity}
                className="mt-1 w-24 rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {hasPalletPrice && (
              <label className="flex items-center gap-2 pb-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={isPallet}
                  onChange={(event) => setIsPallet(event.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Order by full pallet
              </label>
            )}
          </div>

          <button
            ref={addToCartButtonRef}
            type="button"
            onClick={handleAddToCart}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Add to Cart
          </button>

          {variant.specs.length > 0 && (
            <div className="mt-8 space-y-6">
              {variant.specs.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {group.group}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    {group.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex justify-between gap-3 border-b border-border py-2 text-sm"
                      >
                        <span className="text-text-muted">{spec.label}</span>
                        <span className="text-right text-text-primary">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {variant.description && (
            <p className="mt-8 text-sm text-text-muted">{variant.description}</p>
          )}

          {variant.bullets.length > 0 && (
            <ul className="mt-4 space-y-2">
              {variant.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm text-text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
```

Immediately after the `</main>` closing tag (before the `{node?.variants?.length > 0 && (...)}` Options section), add:

```jsx
    <StickyBuyBar
      targetRef={addToCartButtonRef}
      priceLabel={stickyPriceLabel}
      onAddToCart={handleAddToCart}
    />
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: PASS — all cases (the 7 pre-existing plus the 4 new ones) green.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — no regression in any other file (`StickyBuyBar` is newly imported only by `ProductView.js` and its own test).

- [ ] **Step 6: Commit**

```bash
git add components/catalog/ProductView.js components/catalog/ProductView.test.jsx
git commit -m "Product page: sticky buy box on desktop, mobile sticky bar, specs moved above description"
```

---
