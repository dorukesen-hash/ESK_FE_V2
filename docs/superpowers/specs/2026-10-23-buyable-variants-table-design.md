# Buyable variants table: fix the dead "Available Options" table, put it on listing pages too

Date: 2026-10-23
Scope: `VariantsTable.js`, `ProductView.js`, `CatalogNodeView.js`, deleting
`hooks/useVariantSiblings.js` and `components/catalog/ProductCard.js`.
Follows directly from Part 1 (`docs/superpowers/specs/2026-10-23-storefront-catalog-node-foundation.md`),
which this depends on (`useCatalogTree`, `CatalogNodeView`,
`ProductView`'s `node` resolution all come from that round).

## Problem

Two separate problems converge on the same fix:

1. **The product page's "Available Options" table is dead in
   production.** `ProductView.js` renders `<VariantsTable
   variantId={numericId} />`, which calls `useVariantSiblings` ->
   `GET /variant/:id/siblings`. That endpoint does not exist in
   ESK_API — confirmed with a direct request against the live
   production API (`404 Cannot GET /api/variant/738/siblings`). The
   frontend swallows the resulting error silently (`isError` ->
   `VariantsTable` returns `null`), so this has been invisibly broken
   on every product page with no error anywhere.

2. **Uline's listing pages show a buyable table, ours shows a tile
   grid.** Checked directly against uline.com (Boxes -> Corrugated
   Boxes -> Cube Boxes): a listing page for one product style shows a
   dense table — one row per SKU/size, price-per-quantity-bracket
   columns, a quantity input, and an individual "ADD" button per row.
   No navigating to a product page required to buy. ESK_FE_V2's
   `CatalogNodeView` (Part 1) instead renders a `ProductCard` tile
   grid for a node's direct variants — every purchase requires
   clicking into the product page first.

## Decision

Fix both by making the table itself the single source of truth,
sourced from data the app already has in memory — no backend change,
no new endpoint, no second fetch.

Every variant a page needs to show already arrived as part of
`node.variants` on the catalog tree `useCatalogTree()` already
fetched (Part 1): `CatalogNodeView` already has it directly;
`ProductView` already resolves the current variant's own `node` via
`findNode(tree, variant.nodeId)` for its breadcrumb. `node.variants`
is a raw `Variant` row array — the exact shape `GET /variant/:id`
also returns, already shaped by the same `lib/variantFields.js`
helpers (`extractPriceTiers`, `formatSpecValue`) `useVariant.js` uses.

So: `VariantsTable` stops fetching anything. It becomes a plain,
props-driven component — pass it the array of raw variants you
already have, it renders the table.

## Component changes

### `VariantsTable.js`

New props: `{ variants, currentVariantId, productSlug }`.

- `variants`: raw `Variant` rows (same shape as `node.variants` /
  `GET /variant/:id`'s payload). Required.
- `currentVariantId`: optional. If a row's `id` matches, it gets the
  existing highlight treatment. Omitted on listing pages (nothing is
  "current" there).
- `productSlug`: the slug used to build each row's link (see below).
  All variants passed to one `VariantsTable` instance are always
  attached to the same node (that's what makes them "siblings"), so
  this is one string, not per-row.

Internals:

- A local `toTableRow(variant)` replaces `useVariantSiblings.js`'s
  `toSiblingRow` (deleted along with that hook) — maps a raw variant
  to `{ id, title, sku, priceTiers (minus Full pallet), palletPrice,
  unitsPerPallet, specValues }` using `extractPriceTiers` and
  `formatSpecValue` directly from `lib/variantFields.js`.
- `discriminatingFields`, `PriceTiers`, and the desktop-grid /
  mobile-card `VariantRow` rendering are unchanged — this logic was
  already correct, it just needs real data flowing into it.
- **New:** each row's title becomes a `<Link
  href={`/product/${productSlug}/${row.id}`}>` — lets a shopper click
  through to a specific SKU's own page from a listing table, which
  today's tile grid supported (each tile linked) but the table never
  did. This is the one genuinely new piece of UI, modeled on Uline's
  listing rows being clickable.
- `showAll` is a local boolean, not a refetch trigger — every variant
  is already in `variants`, so "Show all N" just lifts a
  `.slice(0, PREVIEW_LIMIT)` cap. `PREVIEW_LIMIT` stays 20 (same
  value `useVariantSiblings.js` used). The button reads `Show all
  {variants.length}` (the old `levelName`-qualified wording — "Load
  all 130 in Corrugated Boxes" — depended on a separate `/siblings`
  count+level API field that no longer exists; the page's own heading,
  rendered by the caller now, already establishes that context).
- If `variants.length === 0`, renders `null` (defensive — both call
  sites already gate on this before rendering the section at all, but
  the component stays safe to use on its own).
- The eyebrow/heading markup ("Options" / "Available Options") and
  the outer `<section className="mx-auto max-w-6xl px-6 py-16">`
  wrapper move **out** of `VariantsTable` — that was page-level
  chrome, and the two call sites want different headings (see below).
  `VariantsTable` renders only the bordered table container (column
  header row + rows + the "Show all" button).

### `hooks/useVariantSiblings.js` — deleted

Along with its test. The endpoint it called never existed in
production; nothing else imports it (`grep` confirms `ProductView.js`
is the only caller).

### `ProductView.js`

Keeps its existing "Options" eyebrow + "Available Options" `<h2>`
wrapped in a `<section className="mx-auto max-w-6xl px-6 py-16">`
(the markup `VariantsTable` used to own), now wrapping:

```jsx
<VariantsTable
  variants={node?.variants ?? []}
  currentVariantId={numericId}
  productSlug={node ? slugify(node.name) : ''}
/>
```

using the `node` already resolved by `useBreadcrumbNodes` (Part 1,
Task 5) — no new data dependency. The section only renders when
`node && node.variants.length > 0`, matching the old implicit
behavior (the table never showed for a variant with no resolvable
node, same as today's not-found-breadcrumb case).

### `CatalogNodeView.js`

Where it currently renders, for a node's direct `variants`, a
`ProductCard` tile grid:

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

replacing the `grid grid-cols-2 ... <ProductCard>` block entirely. No
`currentVariantId` — nothing is "current" on a listing page. The
child-tile section above it (for `node.children`, with the
product-count hint added in Part 1's final review) is untouched.

### `components/catalog/ProductCard.js` — deleted

Along with its test. After the change above, `grep` confirms
`CatalogNodeView.js` was its only remaining caller; it becomes dead
code.

## Visual scope

No re-skinning toward Uline's exact look (fixed Model-No./weight/
bundle-qty columns, their specific borders/typography). This keeps
today's established theme and today's adaptive column selection
(`discriminatingFields` — show a spec column only where it actually
varies across the current row set), which already does better across
this catalog's ~90 heterogeneous spec columns than a fixed column set
would. This matches the already-agreed Parts-2-4 rule: structure can
change, theme (color/typography/logo) does not.

## Testing

Existing Vitest + RTL conventions, per the established pattern in
this repo (not `node:test` — see Part 1's own correction of that
mistake).

- `VariantsTable.test.jsx` — full rewrite. No more mocking
  `useVariantSiblings`; tests pass `variants` arrays (raw Variant
  shape) directly as a prop and assert on rendering/interaction,
  covering every case the current suite already pins (discriminating
  columns, current-row highlight, 3 price tiers per row, add-to-cart
  with pallet auto-detection, "Show all" toggle without a refetch,
  hidden when already fully shown) plus the new per-row Link.
- `hooks/useVariantSiblings.test.jsx` — deleted.
- `components/catalog/ProductCard.test.jsx` — deleted.
- `CatalogNodeView.test.jsx` — the existing "renders a product card
  per variant" test is replaced with an assertion that the table
  renders a row per variant with a working Add button, instead of a
  `ProductCard` link grid.
- `ProductView.test.jsx` — the existing "renders the variant options
  table" test switches its fixture from mocking `useVariantSiblings`
  to supplying `node.variants` on the already-mocked `useCatalogTree`
  tree fixture.

## Out of scope

- The `/search` filters bug reported separately (tracked in memory,
  investigated on its own, unrelated to this component).
- Any visual re-skin beyond what's described above.
- Changes to `Navbar.js`, `CategoryShowcase.js`, `SearchFilters.js`,
  `SearchView.js` — untouched, already done in Part 1.
- A dedicated backend endpoint for siblings — deliberately not built;
  the catalog tree already carries everything needed.
