# Buyable variants table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the dead "Available Options" table on the product page and put the same buyable table on catalog listing pages, sourced entirely from the catalog tree already in memory — no backend change, no new endpoint.

**Architecture:** `VariantsTable` stops fetching (`useVariantSiblings` -> a `/variant/:id/siblings` endpoint that was never built) and becomes a plain, props-driven component: pass it a raw `variants` array (the exact shape `node.variants` and `GET /variant/:id` already return) and it renders the table. `ProductView` and `CatalogNodeView` both already have (or can trivially get) the right `variants` array from the catalog tree `useCatalogTree()` fetched once per page. `ProductCard` becomes unused once `CatalogNodeView` renders the table instead of a tile grid for a node's direct variants, and is deleted.

**Tech Stack:** Next.js 16 App Router, TanStack Query (unchanged elsewhere), Vitest + React Testing Library + `@testing-library/user-event` — this repo's existing, established test convention.

**Spec:** `docs/superpowers/specs/2026-10-23-buyable-variants-table-design.md` (depends on Part 1's spec, `docs/superpowers/specs/2026-10-23-storefront-catalog-node-foundation.md`, for `useCatalogTree`, `CatalogNodeView`, and `ProductView`'s `node` resolution).

## Global Constraints

- `VariantsTable`'s new props are `{ variants, currentVariantId, productSlug }`. `variants` is required (raw Variant rows); `currentVariantId` and the row-highlight behavior it drives are optional (omitted on listing pages); `productSlug` is one string shared by every row in a given table instance, since all variants in one `VariantsTable` always belong to the same node.
- No backend change, no new endpoint. Everything comes from data already fetched via `useCatalogTree()`.
- `hooks/useVariantSiblings.js` is deleted entirely, along with its test — nothing else imports it once `ProductView.js` stops.
- `components/catalog/ProductCard.js` is deleted entirely, along with its test — nothing else imports it once `CatalogNodeView.js` stops.
- No visual re-skin toward uline.com's exact look. Keep this repo's existing theme tokens and the existing adaptive column selection (`discriminatingFields` — only show a spec column where it actually varies across the current row set).
- Every test in this plan follows this repo's existing Vitest + React Testing Library convention (see `components/catalog/VariantsTable.test.jsx` and `components/catalog/ProductView.test.jsx` as they stand before this plan starts, for the established mocking style).

## Review Focus

- A `VariantsTable` rendered with an empty `variants` array must render nothing (both call sites already gate on `variants.length > 0` before mounting it, but the component itself must stay safe standing alone) — covered by a test in Task 1.
- The desktop grid and mobile card markup both render for every row (CSS, not JS, picks which is visible) — every row-level assertion that matches by role/text must account for two matching elements, not one, or tests will throw on `getByRole`/`getByText` finding more than one match. Already true of the pre-existing test file for this component; stays true here, and newly affected call-site tests (Task 2) need the same care.
- `productSlug` must resolve correctly for a node whose name requires Turkish transliteration or multiple words (e.g. "Composite Strapping" -> "composite-strapping") — exercised implicitly by every existing fixture already using real multi-word names; no separate test needed since `slugify` itself is already covered in Part 1.
- "Show all" must not trigger a second network request — since every variant is already in the `variants` array passed in, revealing the rest is a pure local state change. Covered by a test in Task 1 asserting the full set renders without any additional mock/fetch setup being needed.

---

## Task 1: `VariantsTable.js` becomes props-driven; delete `useVariantSiblings`; fix `ProductView.js`

**Files:**
- Modify: `components/catalog/VariantsTable.js`
- Modify: `components/catalog/VariantsTable.test.jsx` (full rewrite)
- Delete: `hooks/useVariantSiblings.js`, `hooks/useVariantSiblings.test.jsx`
- Modify: `components/catalog/ProductView.js`
- Modify: `components/catalog/ProductView.test.jsx`

**Interfaces:**
- Consumes: `extractPriceTiers`, `formatSpecValue`, `SPEC_FIELDS` from `lib/variantFields.js` (existing, unchanged); `useCartStore`, `useUIStore` (existing, unchanged); `Button`, `QuantityInput` (existing, unchanged); in `ProductView.js`, the `node` already resolved by `useBreadcrumbNodes` (Part 1, Task 5) and `slugify` from `lib/slugify.js`.
- Produces: `VariantsTable({ variants, currentVariantId, productSlug })` — the new contract every later task (Task 2) and Part 1's `ProductView.js` both consume.

- [ ] **Step 1: Write the failing tests for the new `VariantsTable` contract**

Replace the full contents of `components/catalog/VariantsTable.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { VariantsTable } from './VariantsTable';

// toTableRow (inside VariantsTable.js) expects RAW variant columns - the
// same shape node.variants / GET /variant/:id return - not the pre-shaped
// row objects the old (deleted) useVariantSiblings hook used to produce.
function rawVariant(overrides = {}) {
  return {
    id: 327,
    title: 'Half Inch',
    sku: 'CC40',
    one_four_units: null,
    five_nine_units: null,
    ten_plus_units: null,
    pallet_pricing: null,
    units_per_pallet: null,
    size: null,
    color: null,
    material_type: null,
    style: null,
    unit: null,
    quantity_case: null,
    break_strength: null,
    core_diameter: null,
    ...overrides,
  };
}

describe('VariantsTable', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
  });

  it('renders nothing when there are no variants', () => {
    const { container } = render(
      <VariantsTable variants={[]} productSlug="composite-strapping" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('only shows spec columns whose value differs somewhere in the set, not ones every row shares', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({ id: 327, title: 'Half Inch', color: 'White', style: 'Standard Duty' }),
          rawVariant({ id: 328, title: 'Five Eighths', color: 'White', style: 'Heavy Duty' }),
        ]}
      />
    );

    expect(screen.getAllByText('Style').length).toBeGreaterThan(0);
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
  });

  it('highlights the current variant row', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        currentVariantId={327}
        variants={[
          rawVariant({ id: 327, title: 'Half Inch' }),
          rawVariant({ id: 328, title: 'Five Eighths' }),
        ]}
      />
    );

    const [currentDesktop] = screen.getAllByText('Half Inch');
    const [otherDesktop] = screen.getAllByText('Five Eighths');
    expect(currentDesktop.closest('div.border-b')).toHaveClass('bg-accent-tint');
    expect(otherDesktop.closest('div.border-b')).not.toHaveClass('bg-accent-tint');
  });

  it('shows all 3 quantity-tier prices per row', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({
            id: 327,
            title: 'Half Inch',
            one_four_units: '12.00',
            five_nine_units: '11.00',
            ten_plus_units: '10.00',
          }),
        ]}
      />
    );

    expect(screen.getAllByText('1-4 units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-9 units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$11.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10+ units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
  });

  it('adds the row quantity to the cart and opens the drawer', async () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({
            id: 327,
            title: 'Half Inch',
            one_four_units: '68.00',
            pallet_pricing: '53.00',
            units_per_pallet: 10,
          }),
        ]}
      />
    );

    const [qty] = screen.getAllByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    const [desktopAdd] = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(desktopAdd);

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 3, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('auto-detects a pallet order once quantity reaches the pallet threshold', async () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({
            id: 327,
            title: 'Half Inch',
            one_four_units: '68.00',
            pallet_pricing: '53.00',
            units_per_pallet: 10,
          }),
        ]}
      />
    );

    const [qty] = screen.getAllByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '10');
    const [desktopAdd] = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(desktopAdd);

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 10, isPallet: true },
    ]);
  });

  it('shows a Show all button only when more rows exist beyond the preview, and reveals them locally with no refetch', async () => {
    const variants = Array.from({ length: 25 }, (_, i) =>
      rawVariant({ id: i + 1, title: `Variant ${i + 1}` })
    );
    render(<VariantsTable productSlug="composite-strapping" variants={variants} />);

    expect(screen.queryByText('Variant 25')).not.toBeInTheDocument();
    const showAll = screen.getByRole('button', { name: 'Show all 25' });
    await userEvent.click(showAll);

    expect(screen.getAllByText('Variant 25').length).toBeGreaterThan(0);
  });

  it('hides the Show all button once every row already fits in the preview', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[rawVariant({ id: 327, title: 'Half Inch' })]}
      />
    );
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });

  it("links each row's title to its product page, built from productSlug and the row's own id", () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[rawVariant({ id: 327, title: 'Half Inch' })]}
      />
    );

    const [link] = screen.getAllByRole('link', { name: 'Half Inch' });
    expect(link).toHaveAttribute('href', '/product/composite-strapping/327');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/VariantsTable.test.jsx`
Expected: FAIL — the current component still imports and calls `useVariantSiblings`, expects a `variantId` prop, and has no `productSlug`/link behavior; none of the new assertions can pass against it.

- [ ] **Step 3: Rewrite `VariantsTable.js`**

Replace the full contents of `components/catalog/VariantsTable.js`:

```jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { SPEC_FIELDS, formatSpecValue, extractPriceTiers } from '@/lib/variantFields';
import { Button } from '@/components/ui/Button';
import { QuantityInput } from './QuantityInput';

const PREVIEW_LIMIT = 20;

function toTableRow(variant) {
  const specValues = {};
  for (const field of SPEC_FIELDS) {
    specValues[field.key] = formatSpecValue(variant, field);
  }

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    priceTiers: extractPriceTiers(variant).filter((tier) => tier.label !== 'Full pallet'),
    palletPrice: variant.pallet_pricing != null ? Number(variant.pallet_pricing) : null,
    unitsPerPallet: variant.units_per_pallet != null ? Number(variant.units_per_pallet) : null,
    specValues,
  };
}

// Only columns where the value actually differs somewhere in this set of
// rows are worth a column - if every variant shares the same Material, a
// Material column is 20+ identical cells of noise, not a comparison aid.
function discriminatingFields(rows) {
  return SPEC_FIELDS.filter((field) => {
    const values = new Set(rows.map((row) => row.specValues[field.key] ?? null));
    return values.size > 1;
  });
}

function PriceTiers({ tiers }) {
  if (tiers.length === 0) return <span className="text-sm text-text-muted">—</span>;
  return (
    <div className="space-y-0.5">
      {tiers.map((tier) => (
        <div key={tier.label} className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-text-muted">{tier.label}</span>
          <span className="font-semibold text-text-primary">${tier.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// Renders as one CSS grid row on sm+ (columns fit the container width and
// shrink/truncate instead of forcing a wider box) and as a stacked card
// below sm, so there's never a horizontally-scrolling table on mobile.
function VariantRow({ row, href, isCurrent, visibleFields, gridTemplateColumns }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  function handleAdd() {
    // No pallet checkbox here - if the chosen quantity reaches the
    // variant's own pallet threshold, treat it as a pallet order
    // automatically, same price outcome as the manual checkbox on the
    // product page's own buy box.
    const isPallet = Boolean(
      row.palletPrice != null && row.unitsPerPallet != null && quantity >= row.unitsPerPallet
    );
    addItem(row.id, quantity, isPallet);
    openCartDrawer();
  }

  const qtyFieldId = `variants-table-qty-${row.id}`;
  const rowClass = isCurrent ? 'bg-accent-tint' : '';

  return (
    <div className={`border-b border-border py-3 last:border-b-0 sm:py-2 ${rowClass}`}>
      {/* Desktop/tablet: one grid row */}
      <div className="hidden items-center gap-3 px-3 sm:grid" style={{ gridTemplateColumns }}>
        <div className="min-w-0">
          <Link
            href={href}
            className="truncate text-sm font-medium text-text-primary hover:text-primary"
          >
            {row.title}
          </Link>
          {row.sku && <p className="truncate text-xs text-text-muted">SKU: {row.sku}</p>}
        </div>
        {visibleFields.map((field) => (
          <p key={field.key} className="truncate text-sm text-text-muted">
            {row.specValues[field.key] ?? '—'}
          </p>
        ))}
        <PriceTiers tiers={row.priceTiers} />
        <div>
          <label htmlFor={qtyFieldId} className="sr-only">
            Quantity for {row.title}
          </label>
          <QuantityInput
            id={qtyFieldId}
            value={quantity}
            onChange={setQuantity}
            className="h-9 w-full max-w-20 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleAdd}>
          Add
        </Button>
      </div>

      {/* Mobile: stacked card */}
      <div className="rounded-lg px-3 sm:hidden">
        <Link href={href} className="text-sm font-medium text-text-primary hover:text-primary">
          {row.title}
        </Link>
        {row.sku && <p className="text-xs text-text-muted">SKU: {row.sku}</p>}

        {visibleFields.length > 0 && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {visibleFields.map((field) => (
              <div key={field.key} className="flex justify-between gap-2 text-xs">
                <dt className="text-text-muted">{field.label}</dt>
                <dd className="text-text-primary">{row.specValues[field.key] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-3">
          <PriceTiers tiers={row.priceTiers} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={`${qtyFieldId}-mobile`} className="sr-only">
            Quantity for {row.title}
          </label>
          <QuantityInput
            id={`${qtyFieldId}-mobile`}
            value={quantity}
            onChange={setQuantity}
            className="h-10 w-20 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" variant="outline" className="flex-1" onClick={handleAdd}>
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VariantsTable({ variants, currentVariantId, productSlug }) {
  const [showAll, setShowAll] = useState(false);

  if (!variants || variants.length === 0) return null;

  const rows = variants.map(toTableRow);
  const visibleFields = discriminatingFields(rows);
  const hasMore = !showAll && rows.length > PREVIEW_LIMIT;
  const visibleRows = showAll ? rows : rows.slice(0, PREVIEW_LIMIT);
  const gridTemplateColumns = `minmax(0,1.6fr) ${visibleFields
    .map(() => 'minmax(0,1fr)')
    .join(' ')} 150px 88px 84px`;

  return (
    <div className="rounded-lg border border-border">
      <div
        className="hidden items-center gap-3 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted sm:grid"
        style={{ gridTemplateColumns }}
      >
        <span>Variant</span>
        {visibleFields.map((field) => (
          <span key={field.key}>{field.label}</span>
        ))}
        <span>Price</span>
        <span>Qty</span>
        <span />
      </div>

      <div className="px-0">
        {visibleRows.map((row) => (
          <VariantRow
            key={row.id}
            row={row}
            href={`/product/${productSlug}/${row.id}`}
            isCurrent={row.id === currentVariantId}
            visibleFields={visibleFields}
            gridTemplateColumns={gridTemplateColumns}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center border-t border-border p-4">
          <Button type="button" variant="outline" onClick={() => setShowAll(true)}>
            Show all {rows.length}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/VariantsTable.test.jsx`
Expected: PASS — all 9 cases green.

- [ ] **Step 5: Delete the dead `useVariantSiblings` hook**

```bash
git rm hooks/useVariantSiblings.js hooks/useVariantSiblings.test.jsx
```

- [ ] **Step 6: Write the failing test for `ProductView.js`'s updated options table**

In `components/catalog/ProductView.test.jsx`:

Remove the `useVariantSiblings` import and its `vi.mock` block entirely (lines 6, 17-19 as the file stands today). Remove `useVariantSiblings.mockReturnValue(...)` from the shared `beforeEach`.

Update the `tree` fixture to give node id 18 a `variants` array (today it has none):

```jsx
const tree = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    children: [
      {
        id: 18,
        name: 'Composite Strapping',
        children: [],
        variants: [
          {
            id: 327,
            title: 'Composite Strapping',
            sku: 'CC40/2',
            one_four_units: '68.00',
            pallet_pricing: '53.00',
            units_per_pallet: 10,
            color: 'White',
          },
        ],
      },
    ],
  },
];
```

Replace the `'renders the variant options table wired to the current variant id'` test with:

```jsx
  it('renders the variant options table sourced from the resolved node, with a link to each row', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    expect(screen.getByRole('heading', { name: 'Available Options' })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'Composite Strapping' })
        .some((link) => link.getAttribute('href') === '/product/composite-strapping/327')
    ).toBe(true);
  });
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: FAIL — `ProductView.js` still imports `useVariantSiblings` indirectly via the old `<VariantsTable variantId={numericId} />` call, which this test file no longer mocks, and the new assertions don't match the current markup (no "Available Options" heading is rendered by `ProductView.js` itself yet — it still lives inside the old `VariantsTable`, which this test's node fixture can't drive since it has no `useVariantSiblings` mock anymore).

- [ ] **Step 8: Update `ProductView.js` to own the "Available Options" heading and pass `node.variants` through**

In `components/catalog/ProductView.js`, add the `slugify` import:

```jsx
import { slugify } from '@/lib/slugify';
```

Replace the closing of the component — from the end of the existing `<main>...</main>` block through the final `<VariantsTable variantId={numericId} />` — with:

```jsx
    </main>

    {node && node.variants.length > 0 && (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Options</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-text-primary">
          Available Options
        </h2>
        <div className="mt-6">
          <VariantsTable
            variants={node.variants}
            currentVariantId={numericId}
            productSlug={slugify(node.name)}
          />
        </div>
      </section>
    )}
    </>
  );
}
```

(the `VariantsTable` import at the top of the file stays as-is — only what it's called with changes).

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: PASS — all 6 cases green.

- [ ] **Step 10: Commit**

```bash
git add components/catalog/VariantsTable.js components/catalog/VariantsTable.test.jsx components/catalog/ProductView.js components/catalog/ProductView.test.jsx
git commit -m "VariantsTable: props-driven, no fetch; fixes the dead product-page options table"
```

---

## Task 2: `CatalogNodeView.js` renders the table instead of a tile grid; delete `ProductCard`

**Files:**
- Modify: `components/catalog/CatalogNodeView.js`
- Modify: `components/catalog/CatalogNodeView.test.jsx`
- Delete: `components/catalog/ProductCard.js`, `components/catalog/ProductCard.test.jsx`

**Interfaces:**
- Consumes: `VariantsTable` (Task 1's new contract), `slugify` (existing, already imported in this file).
- Produces: nothing new — this is the plan's second and last caller of `VariantsTable`.

- [ ] **Step 1: Write the failing tests**

In `components/catalog/CatalogNodeView.test.jsx`, replace the `'renders a product card per variant on the resolved node'` test with:

```jsx
  it('renders a buyable table row per variant on the resolved node', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'A' })[0]).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
    expect(screen.getAllByRole('button', { name: 'Add' }).length).toBeGreaterThan(0);
  });
```

Replace the `'renders both child tiles and a product grid when a node has children and variants at once'` test with (same fixture, assertions switched from a single `getByRole` — which will now throw on finding two matches, desktop + mobile — to `getAllByRole`):

```jsx
  it('renders both child tiles and a buyable table when a node has children and variants at once', () => {
    const mixedTree = [
      {
        id: 9,
        name: 'CORD STRAPPING',
        images: [],
        variants: [{ id: 500, title: 'Loose variant', sku: 'LV1', one_four_units: '10.00', unit: 'Each' }],
        children: [
          { id: 18, name: 'Composite Strapping', images: [], variants: [], children: [] },
        ],
      },
    ];
    useCatalogTree.mockReturnValue({ data: mixedTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    expect(screen.getByRole('link', { name: /Composite Strapping/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Loose variant/ }).length).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/CatalogNodeView.test.jsx`
Expected: FAIL — the component still renders a `ProductCard` grid (a single link per variant, no "Add" button, no `/product/...` href built the same way) for both of these cases.

- [ ] **Step 3: Update `CatalogNodeView.js`**

Replace the import of `ProductCard` with `VariantsTable`:

```jsx
import { VariantsTable } from './VariantsTable';
```

Delete the now-unused `toProductCard` function entirely (its logic — `price`/`unit`/`href` shaping for a single card — is superseded by `VariantsTable`'s own `toTableRow`).

Replace the `variants.length > 0` block:

```jsx
      {variants.length > 0 && (
        <>
          <p className="mt-10 text-text-muted">
            {variants.length} {variants.length === 1 ? 'product' : 'products'}
          </p>
          <div className="mt-4">
            <VariantsTable variants={variants} productSlug={slugify(node.name)} />
          </div>
        </>
      )}
```

(`slugify` is already imported in this file from Part 1; `nodeImage` stays, still used by the child-tile section above).

- [ ] **Step 4: Delete `ProductCard`**

```bash
git rm components/catalog/ProductCard.js components/catalog/ProductCard.test.jsx
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/CatalogNodeView.test.jsx`
Expected: PASS — all 9 cases green.

- [ ] **Step 6: Commit**

```bash
git add components/catalog/CatalogNodeView.js components/catalog/CatalogNodeView.test.jsx
git commit -m "CatalogNodeView: render the buyable variants table instead of a tile grid"
```

---

## Task 3: Full suite, build, manual verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm nothing still imports the deleted files**

Run: `grep -rn "useVariantSiblings\|ProductCard" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=.next`
Expected: no matches.

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — every test file in the repo green.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: Build succeeds with no missing-import errors.

- [ ] **Step 4: Manual verification against the real API**

With the dev server running against the real production API, check:
- A product detail page for a variant whose node has more than one variant (e.g. the real "Composite Strapping" node) now shows a working "Available Options" table with real sibling rows, a working quantity input, and a working Add button that opens the cart drawer.
- A catalog listing page for that same node (e.g. `/category/strapping-load-securement/cord-strapping`) now shows the same table in place of the old tile grid, with working Add buttons directly on the listing page.
- Clicking a row's title in either place navigates to that specific variant's own product page.

- [ ] **Step 5: Commit**

Nothing to commit if all of the above already passed in Tasks 1-2's commits — this task is verification-only. If a fix was needed, commit it here with a clear message before moving on.

---
