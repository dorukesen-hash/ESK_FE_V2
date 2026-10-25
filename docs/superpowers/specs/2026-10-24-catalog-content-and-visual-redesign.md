# Catalog content depth + visual redesign (theme + spec data)

Date: 2026-10-24
Scope: `lib/variantFields.js`, `hooks/useVariant.js`, `components/catalog/ProductView.js`,
`components/catalog/CatalogNodeView.js`, `components/catalog/VariantsTable.js`,
`components/ui/Button.jsx`, `app/globals.css`.
Design system: `design-system/esk-packaging/MASTER.md` (generated via the
`ui-ux-pro-max` skill, dials: variance 3/10, motion 3/10, density 8/10 —
"Minimalism & Swiss Style", dense/dashboard spacing). Its "Page Pattern"
section ("Enterprise Gateway" — Contact Sales CTA, mega menu, client logos)
does not apply here — that's marketing-homepage structure, and this site
already has real self-serve checkout. The palette, typography, spacing/
shadow scale, and component specs are the parts actually adopted.

## Problem

Two distinct, now-verified problems, both raised directly by the user
after seeing the live result of the prior two rounds:

**1. Real variant data isn't shown.** Checked a live production variant
(id 738, Composite Cord Strapping): it has ~45 populated, non-identifier
fields — full description, 6 bullets (already shown), and dozens of real
specs: `system_strength` (1585 LB), `elongation` (12%), `pack_weight`/
`pack_width`/`pack_length`/`pack_height`, `pallet_weight`/`pallet_width`/
`pallet_length`/`pallet_height`, `quantity_case`, `bundle_bale_qty`,
`min_order_quantity_unit`, `product_finish`, `product_grade`, and more.
`lib/variantFields.js`'s `SPEC_FIELDS` whitelist currently surfaces 9 of
them. For a B2B buyer deciding whether something fits their dock or
truck, this is exactly the information that matters, and none of it
reaches the page.

**2. The controls on every page ignore this site's own theme.**
`components/ui/Button.jsx` hardcodes Tailwind `slate-*` gray classes for
every variant (`primary`, `secondary`, `outline`) instead of referencing
the theme tokens `app/globals.css` already defines (`--color-accent`,
`--color-primary`, `--color-border`, etc.) — tokens every *other*
hand-written button in the app already uses (`ProductView`'s own "Add to
Cart" button: `bg-accent ... hover:bg-accent-hover`). Since `Button` is
the shared component for every Add/Show-all/filter-toggle/form-submit
control across the catalog, account pages, search, and forms (7 real
call sites, confirmed by grep), every one of those renders as a flat,
brand-unrelated gray box. This predates this round's work but is what
makes the pages shipped so far read as untouched.

## Decision

**Theme:** Fix `Button.jsx` to use the tokens that already exist, matching
how every other button in this codebase is already styled — not
introducing a new pattern. Checked real usage first: the established
convention is `bg-accent`/`text-accent-foreground`/`hover:bg-accent-hover`
for filled CTAs (never a solid `bg-primary` fill — that doesn't exist
anywhere in this codebase today), and `text-primary`/`hover:text-primary-hover`
for text links. `Button`'s three variants become:

```js
const VARIANT_CLASSES = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'bg-button-secondary-bg text-text-primary hover:bg-accent-tint',
  outline: 'border border-border text-text-primary hover:bg-accent-tint hover:text-primary',
};
```

No shape/padding/radius change — `Button` is shared by 7 call sites
across account/form/search pages this round doesn't otherwise touch;
changing color tokens fixes the diagnosed defect precisely without
re-opening those pages' layout.

`app/globals.css`'s light-mode `--color-primary` moves from `#2a6aa2` to
the design system's `#1E40AF` (with `--color-primary-hover` to `#1E3A8A`,
its own "Foreground" shade — a sensible darker navy for the hover state).
`--color-accent` (`#d97706`) already matches the design system's
Accent/CTA color exactly — no change needed there. Dark mode is
untouched; its own `--color-primary: #5ca0e2` is already a lighter blue
chosen for dark-background contrast, which the light-mode palette change
doesn't affect.

**Content:** Expand `SPEC_FIELDS` from 9 scalar fields to the full set of
genuinely populated, human-meaningful columns on `Variant` (checked
against the real model — `~90` columns total; identifiers, pricing, and
the description/bullets block are already handled elsewhere and excluded
here), each tagged with a `group` for the product page's grouped display:

- **Material & Performance:** color, material, style, finish, grade,
  sold-as unit, break strength (+unit), system strength (+unit),
  elongation (+unit), footage (+unit).
- **Dimensions:** size, thickness, item thickness, outside W×L, usable
  W×L, inside dimensions, core/outside/inside/wire diameter (+units).
- **Packaging & Shipping:** units per case, units per pallet, bundle/bale
  qty, minimum order qty, boxes per pallet, item gross/net weight
  (+units), shipping weight (+unit), dimensional weight (+unit), package
  weight (+unit), pallet weight (+unit).

Package and pallet physical size (length × width × height) become two
*composite* entries — `Package size (L × W × H)` and `Pallet size
(L × W × H)` — each joining three raw columns with one shared unit
("15 x 15 x 16 IN"), the same pattern uline.com's own listing tables use
("INSIDE DIM. L x W x H", confirmed during Part 1's research). These are
kept in a **separate** `COMPOSITE_DIMENSION_FIELDS` array, not folded
into `SPEC_FIELDS` — `VariantsTable`'s comparison-table column logic only
understands one-value-one-key fields, and composite dimensions are a
single-item product-page concern, not a comparison-table column.

Two call sites, two shapes, same data:

1. **Product page (`ProductView.js`), one variant, full disclosure.** A
   new `extractGroupedSpecs(variant)` replaces `extractSpecs`, returning
   `[{ group, specs: [{label, value}] }]` — every populated field from
   `SPEC_FIELDS` plus `COMPOSITE_DIMENSION_FIELDS`, grouped, with empty
   groups dropped. `ProductView.js` renders one sub-heading per group
   instead of today's single flat table.
2. **Comparison table (`VariantsTable.js`), many variants, adaptive
   columns.** `discriminatingFields` keeps filtering `SPEC_FIELDS` down to
   columns that actually vary across the current row set — now drawing
   from ~30 scalar candidates instead of 9, so a real comparison (e.g. 11
   "Composite Strapping" sizes) can surface break strength, system
   strength, weight, etc. as real columns instead of nothing. Capped at
   the first 5 discriminating fields (array order = priority order) so a
   wide comparison doesn't produce an unreadable double-digit-column grid
   — uline.com's own listing tables cap similarly (around 5-6 data
   columns before price/qty/add).

**Visual density:** Apply the design system's density-8 ("dense/
dashboard") spacing scale to `ProductView.js`, `CatalogNodeView.js`, and
`VariantsTable.js` specifically — tighter section padding and gaps than
today's spacious marketing-page treatment, consistent with "Minimalism &
Swiss Style" (clean, functional, grid-based, essential — not ornate).
Shadows move from the soft `shadow-card` (`0 4px 24px`) used elsewhere in
the app to the design system's sharper `--shadow-sm`/`--shadow-md` for
these specific catalog surfaces. No other pages change.

## Testing

- `lib/variantFields.test.js` — **new** (this module has never had one).
  Covers: `formatSpecValue` for both scalar and composite fields (present
  values, missing values, unit joining); `extractGroupedSpecs` grouping
  and empty-group dropping; the existing `extractPriceTiers`/
  `extractBullets` behavior (regression coverage for logic that existed
  untested before this round).
- `hooks/useVariant.test.jsx` — updated fixture/expectation for
  `variant.specs` switching from a flat array to the new grouped shape.
- `components/catalog/ProductView.test.jsx` — updated to assert grouped
  section headings render (e.g. "Material & Performance") instead of a
  flat spec table.
- `components/catalog/VariantsTable.test.jsx` — new case asserting a
  comparison table draws real columns from the expanded field pool, and
  that the column count is capped at 5 even when more fields vary.
- `components/ui/Button.test.jsx` — **new** (this component has never had
  one either). Covers the three variants resolving to the new
  token-based classes.

## Out of scope

- The `/search` filters bug (tracked separately, not yet investigated).
- Any change to `Button`'s shape, size, or the 6 non-catalog pages that
  use it (account, forms, search, login) beyond the color-token fix,
  which applies uniformly and is the point.
- Navbar/CategoryShowcase/home page visual density (unaffected — this
  round is scoped to the three files a shopper actually reads product
  data on).
- Adopting the design system's suggested typography (Fira Code / Fira
  Sans) — a font change is a separate, more visible decision than fixing
  color tokens and expanding data disclosure; not bundled into this round
  without being asked for directly.
- `extradata` (JSONB, schema-less) — not parsed or surfaced; no stable
  shape to build a UI against.
