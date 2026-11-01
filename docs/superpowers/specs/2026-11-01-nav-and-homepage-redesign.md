# Nav + homepage redesign (Part 2 of the uline.com-inspired redesign)

Date: 2026-11-01
Scope: `components/layout/Navbar.js`, `components/home/HeroBanner.js`,
`app/(storefront)/page.js`; moves `components/home/Industries.js` and
`components/home/QuoteSection.js` to `components/info/`; new routes
`app/(storefront)/industries/page.js` and `app/(storefront)/quote/page.js`;
one href update in `components/home/ProductGuidance.js`.

Part of the uline.com-inspired redesign initiative. Part 1 (catalog content/
theme, `docs/superpowers/specs/2026-10-24-catalog-content-and-visual-redesign.md`)
and Part 4 (product page density, `docs/superpowers/specs/2026-11-01-product-page-density-rework.md`)
are already shipped. Part 3 (category-page sidebar) follows this one, as its
own cycle.

## Problem

Two distinct gaps against uline.com's own catalog-site pattern, confirmed by
reading the live code (not assumed from genre alone):

**1. The nav hides the catalog behind one dropdown.** `Navbar.js` wraps all
10 real top-level categories (confirmed live: Strapping & Load Securement,
Edge Protection, Stretch Film & Pallet Wrap, Packaging Tape, Protective
Packaging, Electrical & Utility Supplies, Boxes & Mailers, Tools &
Accessories, Packaging Equipment, plus one more) inside a single "Shop
Products" trigger - nothing about the catalog's own structure is visible
until a shopper clicks that one button. uline.com's nav keeps every
top-level department visible as its own bar item.

**2. The homepage reads as a six-section marketing story, not a catalog
tool.** `app/(storefront)/page.js` runs HeroBanner (3-slide autoplay
carousel) → CategoryShowcase (kept, see below) → FeaturedProducts →
ProductGuidance → Industries We Serve → QuoteSection - four of those six are
narrative/conversion sections uline.com's own homepage doesn't carry at all.

## Decision

**Nav bar - every top-level category always visible:**
`Navbar.js` renders one item per top-level category instead of one "Shop
Products" trigger wrapping all of them. Each item is a real `<Link>` to that
category's page (`navHref`, unchanged helper) *plus* a separate small
chevron-icon button beside the label that opens a compact dropdown listing
that category's own children (reusing the existing recursive `NavNode`
component unchanged - only the wrapping structure changes, from one
`DropdownMenu.Root` wrapping all 10 roots to one `DropdownMenu.Root` per
root, each triggered by its own chevron). The label and the chevron are
separate interactive elements deliberately: a label that is simultaneously a
navigation link and a Radix dropdown trigger is a real interaction conflict
(click fires both), so the brainstorm's "hover-dropdown" framing is realized
here as "click the chevron to preview children, click the label to go
straight to the category" - both outcomes the approved design asked for
(always-visible top-level items; children visible without a full
page load), without the ambiguous combined element.

Bar items, left to right: the 10 category items, then "View All Products"
(a plain link to `/search`, no longer tucked inside the old single dropdown's
footer panel), then "Industries We Serve" (now linking to `/industries`,
not `/#industries`), then "Knowledge Center" (unchanged: disabled,
"Coming Soon"), then "About Us" (unchanged). The bar keeps the existing
`scrollbar-hide overflow-x-auto` horizontal-scroll container - 10 full-length
category names plus four more items will not fit in one viewport width on
most screens, and that was already true of the single-row item strip before
this change.

**Hero - one static banner instead of a 3-slide carousel:**
`HeroBanner.js` keeps its existing visual treatment (the diagonal
`clip-path` image panel, kicker/title/subtitle/CTA layout, dark `bg-ink`
section) but drops the carousel mechanism entirely: `SLIDES` becomes a
single object (the current first slide's content - the Composite strapping
image and "Industrial packaging supplies for every business" copy), and the
`index`/`isPaused` state, the `AUTOPLAY_MS` interval effect, the
reduced-motion `useSyncExternalStore` hook, the numbered slide-tab buttons,
and the progress-bar element are all removed. This is a simplification, not
a new visual direction - uline.com's own banner is similarly static.

**Three homepage sections move off the homepage, onto their own pages -
not deleted:** `ProductGuidance`, `Industries`, and `QuoteSection` are real
features (a working mailto-based quote-request form, real industry/use-case
content) that stay reachable, just not on the homepage. Following this
repo's own established pattern for standalone content pages (`AboutUsView`,
`FaqView`, etc. in `components/info/`, each with its own `app/(storefront)/<route>/page.js`):

- `components/home/Industries.js` → `components/info/IndustriesView.js`,
  routed at `app/(storefront)/industries/page.js`. Content, markup, and the
  existing `id="industries"` anchor are unchanged (the anchor is now simply
  unused - harmless, not worth stripping for this move).
- `components/home/QuoteSection.js` → `components/info/QuoteView.js`,
  routed at `app/(storefront)/quote/page.js`. Content and the mailto
  submission logic are unchanged.
- `components/home/ProductGuidance.js`'s "Get Product Guidance" link target
  changes from `/#quote` to `/quote` (its only change).
- `app/(storefront)/page.js` drops the `ProductGuidance`, `Industries`, and
  `QuoteSection` imports and renders; it keeps `HeroBanner`, the "Shop by
  category" section wrapping `CategoryShowcase` (unchanged), and
  `FeaturedProducts` (unchanged).

`Navbar.js`'s "Industries We Serve" item is the only other reference to the
old `/#industries` anchor (confirmed by grep); its href updates to
`/industries` as already stated above.

**Unchanged:** `CategoryShowcase` (the bento-grid category tiles),
`FeaturedProducts`, `Footer`, the global `Header`/`HeaderSearch` (the site
already has a prominent, always-visible search bar there - no duplicate
search input is being added to the hero or homepage), and the category page
(`CatalogNodeView.js` - Part 3's own scope).

## Testing

- `components/layout/Navbar.test.jsx` (existing file, rewritten): the
  existing "About Us", "Knowledge Center", loading/error-inside-mega-menu,
  and deep-grandchild-path tests are adapted to the new per-category
  structure (each top-level node gets its own link + chevron + dropdown,
  rather than one shared trigger). New case: "Industries We Serve" now
  links to `/industries`. New case: "View All Products" renders as a
  top-level bar link (not inside any category's dropdown) and points to
  `/search`.
- `components/home/HeroBanner.test.jsx` (existing file, rewritten): the
  autoplay-interval, numbered-tab-navigation, and reduced-motion tests are
  removed (the mechanism they test no longer exists); one updated case
  confirms the single static slide's heading/subtitle/CTA render.
- `app/(storefront)/page.test.jsx` (new, no test currently exists for this
  route file): confirms `ProductGuidance`, `Industries`, and `QuoteSection`
  are not rendered on the homepage, and that `HeroBanner`/`CategoryShowcase`/
  `FeaturedProducts` still are.
- `components/info/IndustriesView.test.jsx`, `components/info/QuoteView.test.jsx`
  (new): a straightforward render-smoke-test plus, for `QuoteView`, the
  existing mailto-submission behavior (likely already covered by a test
  that moves with the component - confirm during planning whether
  `Industries.test.jsx`/`QuoteSection.test.jsx` already exist to be moved,
  or need to be written fresh).
- `components/home/ProductGuidance.test.jsx` (existing or new): confirms the
  "Get Product Guidance" link now points to `/quote`.

## Out of scope

- Category-page sidebar (Part 3 - its own spec/plan cycle, next).
- Any redesign of the `Industries`/`QuoteSection` content or layout beyond
  the href/location change - they move as-is.
- Adding a second search input to the hero or homepage - the global header
  search already covers this.
- `CategoryShowcase` and `FeaturedProducts` - explicitly confirmed unchanged
  during design review.
- Cleaning up the one stray top-level catalog node seen during review
  ("Node_1", id 85, no real content) - a backend/content data issue, not a
  frontend nav design concern; the nav renders whatever the live tree
  returns, same as it does today.
