# Product page density rework: sticky buy box + earlier spec placement

Date: 2026-11-01
Scope: `components/catalog/ProductView.js`; new `components/catalog/StickyBuyBar.js`.
Part of the uline.com-inspired redesign initiative's "Part 4" (see Part 1's
spec, `docs/superpowers/specs/2026-10-24-catalog-content-and-visual-redesign.md`,
which scoped basic spacing density to `ProductView.js`/`CatalogNodeView.js`/
`VariantsTable.js` but explicitly left layout structure for a later round).
Parts 2 (nav/homepage visual redesign) and 3 (category-page sidebar) are
separate, not-yet-brainstormed rounds of the same initiative.

## Problem

The right column of `ProductView.js` (title/SKU/price/qty/add-to-cart/
description/bullets/specs) scrolls away with the page. On a product with
many populated spec fields (Part 1 expanded the pool to up to 28 fields
across 3 groups), a buyer who scrolls down to read specs loses the price,
quantity selector, and Add to Cart button entirely, and has to scroll back
up to act on what they just read.

Separately, the grouped spec table currently sits last in the right
column - after the description and bullets - even though for a B2B buyer
deciding whether an item fits their need, it's frequently the decisive
content, and today it's the thing least likely to actually get seen.

## Decision

**Sticky buy box (desktop, `lg:` / ≥1024px):** The right column becomes
`lg:sticky lg:top-32 lg:self-start` inside the existing
`grid gap-8 lg:grid-cols-2` row, so it holds its position in the viewport
while the left column (image gallery) and anything below the two-column
row scroll normally underneath it.

`top-32` (128px) accounts for the storefront layout's own
`sticky top-0 z-20` Header+Navbar stack (`app/(storefront)/layout.js`),
which is already pinned above everything on every page; the buy box's own
`z-index` stays the default (no `z-*` class), so it never layers over that
bar. This repo has no mechanism to measure the header's real rendered
height at runtime, and no tool in this implementation session can open a
browser to verify the exact pixel value - `top-32` is a close estimate
from the header's and navbar's own fixed-height classes (`Header`'s `py-4`
wrapping `h-10` buttons ≈ 72px, `Navbar`'s `h-14` row ≈ 56px, totaling
≈128px) and **must be spot-checked in a real browser before merge**; a
few pixels of gap or overlap is a one-line class tweak, not a redesign.

Only the right column becomes sticky, never the whole two-column grid -
the gallery column (left) keeps scrolling normally. This is also the
pattern uline.com's own product pages use, and it's what keeps the sticky
column's own height constant relative to the viewport rather than being
pinned next to a tall, independently-scrolling image.

**Mobile (<1024px) equivalent — `StickyBuyBar.js` (new component):** Below
`lg`, the right column is not sticky - a `position: sticky` right column
on a single-column mobile layout would pin the *entire* right column's
content, including description/bullets/specs, which defeats the point;
sticky only helps when there's a second, independently-scrolling column
next to it.

Instead, `StickyBuyBar` renders only on mobile (`lg:hidden`), fixed to the
bottom of the viewport
(`fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface px-4 py-3 shadow-card`),
showing the unit price and an "Add to Cart" button. It reuses
`ProductView`'s own `handleAddToCart`/`quantity`/`isPallet` state, passed
down as props - it never re-derives or duplicates that state.

It becomes visible only once the *original*, in-flow Add to Cart button
has scrolled out of view: an `IntersectionObserver` watches a ref on that
existing button element, and `StickyBuyBar`'s visibility follows the
observer's `isIntersecting` (hidden while the real button is still
on-screen, visible once it isn't). A buyer who hasn't scrolled past the
real button yet never sees a redundant second one.

The quantity selector is **not** reachable from the mobile bar - a buyer
who wants to change quantity scrolls up to the real control. This matches
the earlier clarifying answer ("fiyat + miktar (sabit, değiştirilemez)"
for a compact bar) read together with the final confirmation of "fiyat +
sepete ekle" without an interactive quantity stepper, which would need its
own state kept in sync with the real control to avoid the same value
diverging in two places - avoided here by not duplicating it at all.

**Spec table placement:** Within the right column - on both desktop and
mobile, this reordering is not viewport-conditional - the grouped spec
sections (`variant.specs.map(...)`, currently rendered below
`variant.bullets`) move up to directly below the Add to Cart button,
above `variant.description` and `variant.bullets`. This is a JSX
reordering only; no change to `extractGroupedSpecs`, `useVariant`, or the
spec table's own markup/grouping.

**Unchanged:** image:info column ratio (`lg:grid-cols-2`, 50/50),
thumbnail position (horizontal strip below the main image), the
"Available Options" `VariantsTable` section below the fold, and all of
Part 1's existing density/token work.

## Testing

- `components/catalog/ProductView.test.jsx` (existing file, update): assert
  the right column's wrapper carries
  `lg:sticky lg:top-32 lg:self-start`; assert the rendered DOM order has
  the first spec-group heading appearing before the description paragraph
  and before the first bullet (an order assertion via comparing each
  node's position in `container.textContent` or
  `compareDocumentPosition`, not a snapshot).
- `components/catalog/StickyBuyBar.test.jsx` (new): mocks
  `IntersectionObserver` (no existing global mock in `vitest.setup.js` -
  scope the mock to this test file, following the repo's existing
  per-file-mock convention rather than adding a shared one for a single
  consumer). Cases: not visible when the observed element is intersecting
  (real button on-screen); becomes visible once the callback reports
  `isIntersecting: false`; its "Add to Cart" click calls the same
  `onAddToCart` callback passed in as a prop; it carries no internal
  quantity state of its own; renders the unit price text passed in as a
  prop.

## Out of scope

- Image:info column ratio, thumbnail placement - unchanged (clarified
  directly with the user).
- Nav + homepage visual redesign ("Part 2") and category-page sidebar
  ("Part 3") - separate rounds of the same initiative, not yet
  brainstormed.
- Precise pixel-perfect `top-*` offset verification in a real browser -
  flagged above as a known gap this implementation session's tooling
  can't close; a visual spot-check is required before merge.
- A quantity stepper inside the mobile sticky bar - deliberately kept
  read-only per the clarifying answer, to avoid two divergent quantity
  states.
