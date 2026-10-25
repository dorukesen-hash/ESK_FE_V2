# Admin-controlled comparison-table columns

Date: 2026-10-25
Scope: cross-repo — ESK_API (data model), ESK_ADMIN (picker UI), ESK_FE_V2
(consumption). Depends on and extends
`docs/superpowers/specs/2026-10-24-catalog-content-and-visual-redesign.md`
(the field pool, its 3 groups, and `VariantsTable`'s adaptive column
logic this spec now makes overridable).

## Problem

The prior round's comparison-table columns are chosen automatically —
`discriminatingFields` keeps whichever of the ~30-field pool actually
varies across the current node's variants. Verified this works
correctly (confirmed on two real, unrelated product lines: Strapping
gets break/system strength; Corrugated Boxes gets bundle quantity
instead, since strength fields are null there). But automatic selection
is still a guess at what a buyer cares about — it can surface a field
that happens to vary but isn't actually the comparison a buyer wants,
or omit one that's meaningful but happens to be identical across today's
catalog (and would wrongly disappear, rather than always being
available to turn on). The person running the catalog should be able to
pick, per product line, exactly which columns show — not have the UI
guess for them.

## Decision

Add a per-leaf-node, admin-editable list of field keys
(`CatalogNode.displayFields`) that — when set — replaces automatic
column selection for that node's comparison table. When unset (the
default, and true for every existing node until an admin visits it),
the existing automatic logic keeps working exactly as it does today —
no leaf starts out with an empty table.

**Level:** per leaf node (the same node whose `variants` populate one
table), not per category or a single global list — confirmed against
the real catalog that sibling leaves under the same category can need
different columns (not yet observed in practice, but the architecture
shouldn't assume otherwise).

**Scope:** this selection controls the **comparison table's columns
only** (`VariantsTable`, on both the listing page and the product
page's "Available Options" section). The product page's own grouped
spec disclosure (added in the prior round) is unaffected — it already
shows every populated field for the one variant being viewed; there's
no "which to compare" question to answer there.

**Order:** fixed, not admin-chosen. Selected fields render in the same
canonical pool order used throughout (see Field pool below) — picking
is binary (show/hide), not also a reordering tool. Keeps the admin UI a
checklist, not a drag-and-drop list.

**No enforced cap.** The admin is trusted to pick a sane number (the
picker UI hints at 4-6 as a comfortable default — see ESK_ADMIN section
— but doesn't block a larger selection). Unlike the automatic path
(capped at 5 to avoid an algorithm over-selecting), a deliberate human
choice isn't second-guessed by the UI.

## Field pool (canonical, shared across admin picker + both FE
consumers)

The same ~28-field, 3-group pool the prior round defined for the
product page's grouped disclosure, now doubling as the admin picker's
menu and the set `displayFields` values are validated against:

- **Material & Performance:** `color`, `material_type`, `style`,
  `product_finish`, `product_grade`, `unit` ("Sold as"), `break_strength`
  (+`break_strength_unit_of_measure`), `system_strength`
  (+`system_strength_unit_of_measure`), `elongation`
  (+`elongation_unit_of_measure`), `footage` (+`footage_unit_of_measure`).
- **Dimensions:** `size`, `thickness`, `item_thickness`, `outside_w_l`,
  `usable_w_l`, `inside_dimensions`, `core_diameter`
  (+`core_diameter_unit_of_measure`), `outside_diameter`
  (+`outside_diameter_unit_of_measure`), `inside_diameter`
  (+`inside_diameter_unit_of_measure`), `wire_diameter`
  (+`wire_diameter_unit_of_measure`).
- **Packaging & Shipping:** `quantity_case`, `units_per_pallet`,
  `bundle_bale_qty`, `min_order_quantity_unit`, `item_gross_weight`
  (+`item_gross_weight_unit_of_measure`), `item_net_weight`
  (+`item_net_weight_unit_of_measure`), `shipping_weight`
  (+`shipping_weight_unit_of_measure`), `dimensional_weight`
  (+`dimensional_weight_unit_of_measure`).

(The two *composite* L×W×H entries from the prior spec — Package size,
Pallet size — are a product-page-only concept and are not part of this
picker; a comparison table needs one key per column, not a 3-column
join.)

## ESK_API: data model + validation

`db/models/catalogNode.js` gains one field:

```js
displayFields: {
  type: Sequelize.ARRAY(Sequelize.STRING),
  allowNull: true,
},
```

`allowNull: true` with no default — `null` is the explicit "not
configured, use automatic selection" state, distinct from `[]` ("admin
explicitly chose zero extra columns," a legitimate choice the fallback
must not override).

New idempotent migration script, `scripts/addCatalogNodeDisplayFieldsColumn.js`,
same shape as the existing `scripts/addVariantNodeIdColumn.js` precedent
(`sync({force:false})` never ALTERs an existing table) — checks whether
the column already exists via `queryInterface.describeTable`, adds it
via `queryInterface.addColumn` only if missing.

`controller/catalogNodeController.js`:
- `NODE_FIELDS` gains `'displayFields'`, so `createNode`/`updateNode`
  accept it through the existing `pickNodeFields` whitelist.
- New validation, parallel to `ensureUniqueName`: before persisting,
  every entry in a provided `displayFields` array must be one of the
  canonical pool's keys (a flat `ALL_FIELD_KEYS` constant mirroring the
  groups above); reject with 400 and the offending key(s) listed
  otherwise. Keeps the column from silently accumulating typos or
  stale keys if the pool ever changes.

`getTree`/`getFullTree` need no change — both already
`CatalogNode.findAll({ raw: true })` and spread every column onto each
tree node (`buildTree`), so `displayFields` flows to the storefront
automatically once the column exists.

## ESK_ADMIN: the picker UI

`components/catalog/CatalogNodeFormModal.js` gains a new section,
available both when creating and editing a node — checked against the
real component: `name`/`description`/`sku`/`available`/`parentId` are
all already set on one shared create-or-edit form with no
"save-first" restriction; only image/variant attachment genuinely needs
the node's id first (a real FK dependency), and `displayFields` has no
such dependency. The new section: **"Table columns"** — a checklist
grouped under the same 3
headings as the field pool (Material & Performance / Dimensions /
Packaging & Shipping), one checkbox per field's human label (e.g.
"Break strength", "Units per pallet"). A small hint line under the
section heading: *"Leave all unchecked to let these choose themselves
based on what actually varies. Pick 4-6 for a focused comparison."*

A new small constant module, `lib/comparisonFields.js` (ESK_ADMIN's own
copy of the pool + labels — this repo doesn't import from ESK_FE_V2, so
the list is duplicated once, matching the existing precedent of
`lib/catalogNodeTree.js` existing separately, slightly adapted, in both
ESK_ADMIN and ESK_FE_V2).

Submitting the form includes `displayFields: string[]` (the checked
keys) only when `formState.dirtyFields.displayFields` is true (react-
hook-form's own per-field dirty tracking, already available via the
`formState` this component already destructures) — so a node whose
checklist was never touched sends nothing and keeps its current `null`/
automatic state, while explicitly unchecking everything sends `[]` and
is honored as "zero extra columns," per Decision. `useUpdateCatalogNode`/
`useCreateCatalogNode` pass the field straight through — no reshaping
needed, the API already accepts the raw array.

## ESK_FE_V2: consumption

`lib/variantFields.js` gains a new pure function:

```js
export function pickDisplayFields(rows, displayFields) {
  if (displayFields && displayFields.length > 0) {
    const selected = new Set(displayFields);
    return SPEC_FIELDS.filter((field) => selected.has(field.key));
  }
  return discriminatingFields(rows); // existing function, unchanged
}
```

(`discriminatingFields` itself — currently private to
`VariantsTable.js` — moves into `lib/variantFields.js` alongside it, so
both branches live next to each other and `VariantsTable.js` imports
one decision function instead of reimplementing the branch.)

`VariantsTable`'s new `displayFields` prop (the raw array off the node,
or `undefined`) is threaded through from both call sites:
- `CatalogNodeView.js`: `<VariantsTable variants={variants}
  displayFields={node.displayFields} ... />` — `node` is the exact same
  resolved node already driving everything else on that page.
- `ProductView.js`: `<VariantsTable variants={node.variants}
  displayFields={node.displayFields} ... />` — same `node` the
  breadcrumb already resolves.

No change to `VariantsTable`'s internal column-count cap behavior for
the *automatic* branch (still capped at 5); the *admin-selected* branch
has no cap, per Decision above.

## Testing

- ESK_API: a new `controller/catalogNodeController.test.js` case (file
  already exists from Part 1, extended) for the key-validation rejection
  path; manual verification against the real DB for the migration
  script and a real create/update round-trip, matching this whole
  initiative's established verification style.
- ESK_ADMIN: component test for the new checklist section rendering the
  3 groups and submitting the right array shape; no existing test
  convention adds a different pattern here (Part 1 of ESK_ADMIN's own
  round had no component tests — manual verification was the norm
  there, and stays the norm now).
- ESK_FE_V2: `lib/variantFields.test.js` (already being created this
  round) gains cases for `pickDisplayFields` — admin selection present
  (ignores row variance entirely, even for an all-null field), admin
  selection empty array (shows zero extra columns, not the fallback),
  admin selection absent/`null` (falls back to `discriminatingFields`
  unchanged). `VariantsTable.test.jsx` gains a case asserting a
  `displayFields` prop overrides what rows would otherwise
  auto-discriminate to.

## Out of scope

- Reordering selected columns (fixed canonical order, per Decision).
- A cap on admin-selected column count.
- Applying this selection to the product page's own grouped spec
  disclosure (scope is the comparison table only, per Decision).
- Bulk-editing `displayFields` across many nodes at once (e.g. "apply
  this set to every leaf under Strapping & Load Securement") — one
  node at a time via the existing edit form, for this round.
