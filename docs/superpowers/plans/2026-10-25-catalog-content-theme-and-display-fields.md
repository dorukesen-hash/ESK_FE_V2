# Catalog content depth, theme fix, and admin-controlled comparison columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the theme tokens every catalog button ignores, expand the spec-field pool from 9 to 28 real fields (grouped on the product page, adaptively columned on the comparison table), and let an admin-chosen `displayFields` list override that adaptive selection when the backend provides one.

**Architecture:** This plan implements two specs in the order their own dependency requires: the content/theme spec first (expanding `SPEC_FIELDS`, grouping the product page's disclosure, fixing `Button.jsx`'s tokens), then the admin-override spec on top of it (moving `discriminatingFields` into the shared module, adding `pickDisplayFields`, threading a `displayFields` prop through both `VariantsTable` call sites). Both specs' FE pieces land in this one plan because the second's `VariantsTable` changes are written against the first's already-expanded field pool — implementing them out of order would mean writing `pickDisplayFields` against a 9-field pool and then redoing it.

**Tech Stack:** Next.js 16, TanStack Query, Vitest + React Testing Library + `@testing-library/user-event` (this repo's established convention).

**Spec:** `docs/superpowers/specs/2026-10-24-catalog-content-and-visual-redesign.md` (content/theme) and `docs/superpowers/specs/2026-10-25-admin-controlled-comparison-columns.md` (admin override, "ESK_FE_V2: consumption" section) — the second depends on and extends the first.

## Global Constraints

- `SPEC_FIELDS`'s 28 keys, in the exact grouping below, must match ESK_API's `ALL_DISPLAY_FIELD_KEYS` (`controller/catalogNodeTree.js` there) key-for-key — a mismatch would mean an admin-selected key this app never recognizes, or a selectable key the server rejects.
- `discriminatingFields` (moved from `VariantsTable.js` into `lib/variantFields.js`) now caps its result at the first 5 matches — this is a new constraint introduced by this plan specifically because the pool it draws from just grew from 9 to 28 fields; the un-capped behavior that shipped against the 9-field pool was never a problem in practice; it would be against 28.
- `pickDisplayFields(rows, displayFields)`'s `displayFields` parameter distinguishes `null`/`undefined` ("not configured, use `discriminatingFields`") from `[]` ("admin explicitly chose zero extra columns, show none") — the admin-selected branch is never filtered by whether a field actually varies; manual control means manual control.
- No new dependency, no font change, no visual re-skin beyond the specific token and spacing changes named in this plan.

## Review Focus

- A variant missing most of the newly-added 28-field pool's columns entirely (an older or sparsely-filled row) must not crash `extractGroupedSpecs` or `discriminatingFields` — both already only read a field if present (`formatSpecValue`'s `== null` check treats `undefined` the same as `null`), so this is confirmed by existing-pattern re-use, not new code, but gets one explicit test per function regardless.
- A composite dimension entry (e.g. Package size) with only some of its 3 parts populated must not render a partial/misleading value (e.g. "15 x x 16 IN") — it must be omitted entirely when any part is missing.
- `VariantsTable` receiving `displayFields={[]}` (not `undefined`, not `null`) must show zero extra columns, not fall back to automatic selection — this is the one case easiest to get backwards with a loose-equality check, and the one the spec calls out explicitly as a real, intended admin choice.
- Changing `Button.jsx`'s token classes must not break any of its other 6 real call sites (account, forms, search, login) — confirmed via `grep` that no existing test in this repo asserts on the specific `slate-*` classes being replaced, so there is nothing to update there, but the full suite run in the final task is what actually proves nothing broke.

---

## Task 1: Fix `Button.jsx`'s theme tokens

**Files:**
- Modify: `components/ui/Button.jsx`
- Modify: `components/ui/Button.test.jsx` (existing file, add cases)
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `Button`'s rendered class list for each variant — no prop/signature change, only which classes are applied.

- [ ] **Step 1: Write the failing tests**

Add to `components/ui/Button.test.jsx`:

```jsx
  it('uses the theme accent color for the primary variant, not a generic gray', () => {
    render(<Button variant="primary">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toContain('bg-accent');
    expect(button.className).toContain('text-accent-foreground');
    expect(button.className).not.toContain('slate');
  });

  it('uses theme tokens for the secondary variant, not a generic gray', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).not.toContain('slate');
  });

  it('uses theme border/tint tokens for the outline variant, not a generic gray', () => {
    render(<Button variant="outline">Add</Button>);
    const button = screen.getByRole('button', { name: 'Add' });
    expect(button.className).toContain('border-border');
    expect(button.className).not.toContain('slate');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/ui/Button.test.jsx`
Expected: FAIL — the current `VARIANT_CLASSES` use `bg-slate-900`/`bg-slate-100`/`border-slate-300`, so every new `not.toContain('slate')` assertion fails, and `bg-accent` is absent.

- [ ] **Step 3: Fix `VARIANT_CLASSES`**

In `components/ui/Button.jsx`, replace:

```js
const VARIANT_CLASSES = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 text-slate-900 hover:bg-slate-50',
};
```

with:

```js
const VARIANT_CLASSES = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'bg-button-secondary-bg text-text-primary hover:bg-accent-tint',
  outline: 'border border-border text-text-primary hover:bg-accent-tint hover:text-primary',
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/ui/Button.test.jsx`
Expected: PASS — all cases, including the 3 pre-existing ones, green.

- [ ] **Step 5: Deepen `--color-primary`**

In `app/globals.css`, in the `@theme { ... }` block (the light-mode tokens), change:

```css
  --color-primary: #2a6aa2;
  --color-primary-hover: #1f5480;
```

to:

```css
  --color-primary: #1f5480;
  --color-primary-hover: #163f61;
```

(`#1f5480` is this app's own existing `--color-primary-hover` value, promoted to the base color — not a new color. `--color-accent`/`--color-accent-hover` are unchanged; dark mode's `.dark` block is unchanged, per the spec's revised Decision section.)

- [ ] **Step 6: Commit**

```bash
git add components/ui/Button.jsx components/ui/Button.test.jsx app/globals.css
git commit -m "Fix Button to use this app's own theme tokens instead of generic gray"
```

---

## Task 2: Expand the spec-field pool + grouped product-page disclosure

**Files:**
- Modify: `lib/variantFields.js`
- Create: `lib/variantFields.test.js`

**Interfaces:**
- Produces: `SPEC_FIELDS` (now 28 entries, each `{ key, label, group, unitKey? }`), `COMPOSITE_DIMENSION_FIELDS` (4 entries, each `{ label, group, dimensionKeys: string[], unit? , unitKey? }`), `extractGroupedSpecs(variant)` returning `[{ group: string, specs: [{ label, value }] }]` — replaces `extractSpecs`. `extractPriceTiers`/`extractBullets`/`formatSpecValue` unchanged in behavior, now covered by tests for the first time.

- [ ] **Step 1: Write the failing tests**

Create `lib/variantFields.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  SPEC_FIELDS,
  COMPOSITE_DIMENSION_FIELDS,
  formatSpecValue,
  extractPriceTiers,
  extractBullets,
  extractGroupedSpecs,
} from './variantFields';

describe('SPEC_FIELDS', () => {
  it('has exactly 28 unique keys', () => {
    expect(SPEC_FIELDS).toHaveLength(28);
    expect(new Set(SPEC_FIELDS.map((f) => f.key)).size).toBe(28);
  });

  it('every field has a group', () => {
    for (const field of SPEC_FIELDS) {
      expect(field.group).toBeTruthy();
    }
  });
});

describe('formatSpecValue', () => {
  it('joins a value with its unit when the field has a unitKey', () => {
    const field = { key: 'break_strength', unitKey: 'break_strength_unit_of_measure' };
    expect(formatSpecValue({ break_strength: 990, break_strength_unit_of_measure: 'LB' }, field)).toBe('990 LB');
  });

  it('returns the bare value when the field has no unitKey', () => {
    const field = { key: 'color' };
    expect(formatSpecValue({ color: 'White' }, field)).toBe('White');
  });

  it('returns null for a missing or empty value', () => {
    const field = { key: 'color' };
    expect(formatSpecValue({ color: null }, field)).toBeNull();
    expect(formatSpecValue({ color: '' }, field)).toBeNull();
    expect(formatSpecValue({}, field)).toBeNull();
  });
});

describe('extractPriceTiers', () => {
  it('includes only tiers with a real price', () => {
    expect(
      extractPriceTiers({ one_four_units: '68.00', five_nine_units: null, ten_plus_units: '60.00', pallet_pricing: null })
    ).toEqual([
      { label: '1-4 units', price: 68 },
      { label: '10+ units', price: 60 },
    ]);
  });
});

describe('extractBullets', () => {
  it('drops empty and missing bullets, keeps real ones in order', () => {
    expect(extractBullets({ bullet_1: 'Strong', bullet_2: '', bullet_3: null, bullet_4: 'Durable' })).toEqual([
      'Strong',
      'Durable',
    ]);
  });
});

describe('extractGroupedSpecs', () => {
  it('groups populated scalar fields under their real group label, in group order', () => {
    const variant = {
      color: 'White',
      style: 'Standard Duty',
      break_strength: 990,
      break_strength_unit_of_measure: 'LB',
      size: '5/8" x 2790\'',
      quantity_case: 2,
    };
    const groups = extractGroupedSpecs(variant);
    expect(groups.map((g) => g.group)).toEqual(['Material & Performance', 'Dimensions', 'Packaging & Shipping']);
    expect(groups[0].specs).toEqual([
      { label: 'Color', value: 'White' },
      { label: 'Style', value: 'Standard Duty' },
      { label: 'Break strength', value: '990 LB' },
    ]);
  });

  it('omits a group entirely when none of its fields are populated', () => {
    const groups = extractGroupedSpecs({ color: 'White' });
    expect(groups.map((g) => g.group)).toEqual(['Material & Performance']);
  });

  it('joins a composite dimension field only when every part is present, with its unit', () => {
    const complete = extractGroupedSpecs({ pack_length: '15.00', pack_width: '15.00', pack_height: '16.00' });
    const packagingGroup = complete.find((g) => g.group === 'Packaging & Shipping');
    expect(packagingGroup.specs).toEqual([{ label: 'Package size (L x W x H)', value: '15.00 x 15.00 x 16.00 IN' }]);

    const incomplete = extractGroupedSpecs({ pack_length: '15.00', pack_width: '15.00' });
    const incompletePackagingGroup = incomplete.find((g) => g.group === 'Packaging & Shipping');
    expect(incompletePackagingGroup).toBeUndefined();
  });

  it('uses the real unit column for pallet size, not a hardcoded unit', () => {
    const groups = extractGroupedSpecs({
      pallet_length: 45,
      pallet_width: 45,
      pallet_height: 84,
      pallet_length_unit_of_measure: 'IN',
    });
    const packagingGroup = groups.find((g) => g.group === 'Packaging & Shipping');
    expect(packagingGroup.specs).toEqual([{ label: 'Pallet size (L x W x H)', value: '45 x 45 x 84 IN' }]);
  });

  it('returns an empty array for a variant with nothing populated', () => {
    expect(extractGroupedSpecs({})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/variantFields.test.js`
Expected: FAIL — `SPEC_FIELDS` has 9 entries without a `group` key, `COMPOSITE_DIMENSION_FIELDS` and `extractGroupedSpecs` don't exist.

- [ ] **Step 3: Replace `SPEC_FIELDS`, add `COMPOSITE_DIMENSION_FIELDS` and `extractGroupedSpecs`**

Replace the full contents of `lib/variantFields.js`:

```js
// Shared field definitions + extraction helpers for the raw Variant payload
// the API returns. Used by the single-variant detail hook (useVariant),
// the product page's grouped spec disclosure (ProductView), and the
// buyable variants table (VariantsTable) so none of the three drift on
// what a "price tier", "spec", or "group" means.

export const PRICE_TIER_FIELDS = [
  { key: 'one_four_units', label: '1-4 units' },
  { key: 'five_nine_units', label: '5-9 units' },
  { key: 'ten_plus_units', label: '10+ units' },
  { key: 'pallet_pricing', label: 'Full pallet' },
];

export const BULLET_FIELDS = ['bullet_1', 'bullet_2', 'bullet_3', 'bullet_4', 'bullet_5', 'bullet_6'];

// The full comparison/disclosure pool - 28 real, populated Variant
// columns, grouped for the product page's disclosure and also the
// exact key set ESK_API's ALL_DISPLAY_FIELD_KEYS validates an admin's
// displayFields selection against (controller/catalogNodeTree.js
// there) - keep the two in sync; a key here that doesn't exist there
// would get every admin-selected table rejected with a 400.
export const SPEC_FIELDS = [
  // Material & Performance
  { key: 'color', label: 'Color', group: 'Material & Performance' },
  { key: 'material_type', label: 'Material', group: 'Material & Performance' },
  { key: 'style', label: 'Style', group: 'Material & Performance' },
  { key: 'product_finish', label: 'Finish', group: 'Material & Performance' },
  { key: 'product_grade', label: 'Grade', group: 'Material & Performance' },
  { key: 'unit', label: 'Sold as', group: 'Material & Performance' },
  { key: 'break_strength', label: 'Break strength', unitKey: 'break_strength_unit_of_measure', group: 'Material & Performance' },
  { key: 'system_strength', label: 'System strength', unitKey: 'system_strength_unit_of_measure', group: 'Material & Performance' },
  { key: 'elongation', label: 'Elongation', unitKey: 'elongation_unit_of_measure', group: 'Material & Performance' },
  { key: 'footage', label: 'Footage', unitKey: 'footage_unit_of_measure', group: 'Material & Performance' },
  // Dimensions
  { key: 'size', label: 'Size', group: 'Dimensions' },
  { key: 'thickness', label: 'Thickness', group: 'Dimensions' },
  { key: 'item_thickness', label: 'Item thickness', group: 'Dimensions' },
  { key: 'outside_w_l', label: 'Outside W x L', group: 'Dimensions' },
  { key: 'usable_w_l', label: 'Usable W x L', group: 'Dimensions' },
  { key: 'inside_dimensions', label: 'Inside dimensions', group: 'Dimensions' },
  { key: 'core_diameter', label: 'Core diameter', unitKey: 'core_diameter_unit_of_measure', group: 'Dimensions' },
  { key: 'outside_diameter', label: 'Outside diameter', unitKey: 'outside_diameter_unit_of_measure', group: 'Dimensions' },
  { key: 'inside_diameter', label: 'Inside diameter', unitKey: 'inside_diameter_unit_of_measure', group: 'Dimensions' },
  { key: 'wire_diameter', label: 'Wire diameter', unitKey: 'wire_diameter_unit_of_measure', group: 'Dimensions' },
  // Packaging & Shipping
  { key: 'quantity_case', label: 'Units per case', group: 'Packaging & Shipping' },
  { key: 'units_per_pallet', label: 'Units per pallet', group: 'Packaging & Shipping' },
  { key: 'bundle_bale_qty', label: 'Bundle/bale qty', group: 'Packaging & Shipping' },
  { key: 'min_order_quantity_unit', label: 'Min. order qty', group: 'Packaging & Shipping' },
  { key: 'item_gross_weight', label: 'Gross weight', unitKey: 'item_gross_weight_unit_of_measure', group: 'Packaging & Shipping' },
  { key: 'item_net_weight', label: 'Net weight', unitKey: 'item_net_weight_unit_of_measure', group: 'Packaging & Shipping' },
  { key: 'shipping_weight', label: 'Shipping weight', unitKey: 'shipping_weight_unit_of_measure', group: 'Packaging & Shipping' },
  { key: 'dimensional_weight', label: 'Dimensional weight', unitKey: 'dimensional_weight_unit_of_measure', group: 'Packaging & Shipping' },
];

// Product-page-only entries: either a L x W x H join of 3 raw columns
// (one shared unit) or a single weight column - never part of the
// admin-selectable/comparison-table pool above, since VariantsTable's
// column logic understands one-key-one-column, not a 3-column join.
// pack_* columns have no unit-of-measure column of their own (always
// inches/lbs in this schema); pallet_* columns do.
export const COMPOSITE_DIMENSION_FIELDS = [
  {
    label: 'Package size (L x W x H)',
    group: 'Packaging & Shipping',
    dimensionKeys: ['pack_length', 'pack_width', 'pack_height'],
    unit: 'IN',
  },
  {
    label: 'Package weight',
    group: 'Packaging & Shipping',
    dimensionKeys: ['pack_weight'],
    unit: 'LB',
  },
  {
    label: 'Pallet size (L x W x H)',
    group: 'Packaging & Shipping',
    dimensionKeys: ['pallet_length', 'pallet_width', 'pallet_height'],
    unitKey: 'pallet_length_unit_of_measure',
  },
  {
    label: 'Pallet weight',
    group: 'Packaging & Shipping',
    dimensionKeys: ['pallet_weight'],
    unitKey: 'pallet_weight_unit_of_measure',
  },
];

export function formatSpecValue(variant, field) {
  const value = variant[field.key];
  if (value == null || value === '') return null;
  const unit = field.unitKey ? variant[field.unitKey] : '';
  return unit ? `${value} ${unit}` : String(value);
}

export function extractPriceTiers(variant) {
  return PRICE_TIER_FIELDS.map((tier) => ({
    label: tier.label,
    price: variant[tier.key] ? Number(variant[tier.key]) : null,
  })).filter((tier) => tier.price != null);
}

export function extractBullets(variant) {
  return BULLET_FIELDS.map((key) => variant[key]).filter(Boolean);
}

function formatCompositeDimension(variant, field) {
  const values = field.dimensionKeys.map((key) => variant[key]);
  if (values.some((value) => value == null || value === '')) return null;
  const unit = field.unitKey ? variant[field.unitKey] : field.unit;
  const joined = values.join(' x ');
  return unit ? `${joined} ${unit}` : joined;
}

export function extractGroupedSpecs(variant) {
  const groups = [];

  function pushSpec(group, label, value) {
    let entry = groups.find((g) => g.group === group);
    if (!entry) {
      entry = { group, specs: [] };
      groups.push(entry);
    }
    entry.specs.push({ label, value });
  }

  for (const field of SPEC_FIELDS) {
    const value = formatSpecValue(variant, field);
    if (value) pushSpec(field.group, field.label, value);
  }

  for (const field of COMPOSITE_DIMENSION_FIELDS) {
    const value = formatCompositeDimension(variant, field);
    if (value) pushSpec(field.group, field.label, value);
  }

  return groups;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/variantFields.test.js`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/variantFields.js lib/variantFields.test.js
git commit -m "Expand SPEC_FIELDS to 28 real fields; add grouped + composite-dimension disclosure"
```

---

## Task 3: `useVariant.js` + `ProductView.js` render grouped specs

**Files:**
- Modify: `hooks/useVariant.js`
- Modify: `hooks/useVariant.test.jsx`
- Modify: `components/catalog/ProductView.js`
- Modify: `components/catalog/ProductView.test.jsx`

**Interfaces:**
- Consumes: `extractGroupedSpecs` (Task 2).
- Produces: `useVariant(id)`'s returned `specs` field changes shape from `[{label, value}]` to `[{group, specs: [{label, value}]}]` — a breaking change to this one field, contained entirely within this task.

- [ ] **Step 1: Write the failing test for `useVariant.js`**

In `hooks/useVariant.test.jsx`, replace the `specs:` block inside the existing `'shapes the raw variant...'` test's expected result:

```jsx
      specs: [
        {
          group: 'Material & Performance',
          specs: [
            { label: 'Color', value: 'White' },
            { label: 'Material', value: 'Polyester' },
            { label: 'Sold as', value: 'Coils' },
            { label: 'Break strength', value: '530 LB' },
          ],
        },
        {
          group: 'Dimensions',
          specs: [{ label: 'Size', value: '1/2" x 3610\'' }],
        },
      ],
```

(this replaces the old flat `specs: [{ label: 'Size', ... }, ...]` array — field order within each group follows `SPEC_FIELDS`' own order, so Color/Material/Sold-as/Break-strength land in `Material & Performance` before `Size` lands in its own `Dimensions` group, exactly as `extractGroupedSpecs` produces them.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run hooks/useVariant.test.jsx`
Expected: FAIL — `useVariant.js` still calls `extractSpecs`, which doesn't exist anymore after Task 2 (it was replaced by `extractGroupedSpecs`), so this breaks loudly rather than silently mismatching shape.

- [ ] **Step 3: Update `useVariant.js`**

In `hooks/useVariant.js`, change the import:

```js
import { extractPriceTiers, extractBullets, extractGroupedSpecs } from '@/lib/variantFields';
```

and the `specs` line inside `toVariantDetail`:

```js
    specs: extractGroupedSpecs(variant),
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run hooks/useVariant.test.jsx`
Expected: PASS.

- [ ] **Step 5: Write the failing test for `ProductView.js`**

In `components/catalog/ProductView.test.jsx`, change `baseVariant`'s `specs` field:

```js
  specs: [{ group: 'Material & Performance', specs: [{ label: 'Color', value: 'White' }] }],
```

Add a new test:

```jsx
  it('renders each spec group with its heading and rows', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    expect(screen.getByText('Material & Performance')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('White')).toBeInTheDocument();
  });
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: FAIL — the new test can't find "Material & Performance" anywhere; the current code renders a flat `<table>` iterating `variant.specs.map(spec => ...)` where each `spec` is now a `{group, specs}` object with no `.label`/`.value`, so those table cells render empty.

- [ ] **Step 7: Replace the flat spec table with grouped sections**

In `components/catalog/ProductView.js`, replace:

```jsx
          {variant.specs.length > 0 && (
            <table className="mt-8 w-full text-sm">
              <tbody>
                {variant.specs.map((spec) => (
                  <tr key={spec.label} className="border-b border-border">
                    <td className="py-2 text-text-muted">{spec.label}</td>
                    <td className="py-2 text-right text-text-primary">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
```

with:

```jsx
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
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: PASS — all cases, including the new one, green.

- [ ] **Step 9: Commit**

```bash
git add hooks/useVariant.js hooks/useVariant.test.jsx components/catalog/ProductView.js components/catalog/ProductView.test.jsx
git commit -m "ProductView: render grouped spec sections instead of a flat table"
```

---

## Task 4: Move `discriminatingFields` into `lib/variantFields.js`; add `pickDisplayFields`; wire `VariantsTable` to use it

**Files:**
- Modify: `lib/variantFields.js`
- Modify: `lib/variantFields.test.js`
- Modify: `components/catalog/VariantsTable.js`
- Modify: `components/catalog/VariantsTable.test.jsx`

**Interfaces:**
- Consumes: `SPEC_FIELDS` (Task 2, already in this module).
- Produces: `discriminatingFields(rows)` (now capped at 5, now exported from `lib/variantFields.js` instead of living privately in `VariantsTable.js`), `pickDisplayFields(rows, displayFields)`, and `VariantsTable`'s final prop contract — `{ variants, currentVariantId, productSlug, displayFields }` — that both call sites (Task 5) use.

This task's steps are ordered so the suite is green only at its single
commit point, never red in between commits — moving a function and
updating its only call site are two logically separate changes, but
splitting them into two *commits* would mean committing a known-broken
`VariantsTable.test.jsx` in between. One task, one commit, both halves
land together.

- [ ] **Step 1: Write the failing tests for the two new functions**

Add to `lib/variantFields.test.js`:

```js
import { discriminatingFields, pickDisplayFields } from './variantFields';

function row(overrides = {}) {
  return { id: 1, specValues: {}, ...overrides };
}

describe('discriminatingFields', () => {
  it('keeps only fields whose value differs somewhere in the row set', () => {
    const rows = [
      row({ specValues: { color: 'White', style: 'Standard Duty' } }),
      row({ specValues: { color: 'White', style: 'Heavy Duty' } }),
    ];
    const fields = discriminatingFields(rows);
    expect(fields.some((f) => f.key === 'style')).toBe(true);
    expect(fields.some((f) => f.key === 'color')).toBe(false);
  });

  it('caps the result at 5 fields even when more genuinely vary', () => {
    const rows = [
      row({ specValues: { color: 'White', material_type: 'A', style: 'A', product_finish: 'A', product_grade: 'A', unit: 'A' } }),
      row({ specValues: { color: 'Black', material_type: 'B', style: 'B', product_finish: 'B', product_grade: 'B', unit: 'B' } }),
    ];
    expect(discriminatingFields(rows)).toHaveLength(5);
  });
});

describe('pickDisplayFields', () => {
  const rows = [
    row({ specValues: { break_strength: 750 } }),
    row({ specValues: { break_strength: 750 } }),
  ];

  it('falls back to discriminatingFields when displayFields is null or undefined', () => {
    expect(pickDisplayFields(rows, null)).toEqual(discriminatingFields(rows));
    expect(pickDisplayFields(rows, undefined)).toEqual(discriminatingFields(rows));
  });

  it('honors an explicit selection even when the field does not vary across rows', () => {
    const result = pickDisplayFields(rows, ['break_strength']);
    expect(result.map((f) => f.key)).toEqual(['break_strength']);
  });

  it('honors an explicit empty array as "show zero extra columns", not a fallback', () => {
    expect(pickDisplayFields(rows, [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/variantFields.test.js`
Expected: FAIL — `discriminatingFields` and `pickDisplayFields` don't exist in `lib/variantFields.js` yet.

- [ ] **Step 3: Add both functions**

Add to `lib/variantFields.js`, after `extractGroupedSpecs`:

```js
// Only columns where the value actually differs somewhere in this set
// of rows are worth a column - if every variant shares the same
// Material, a Material column is 20+ identical cells of noise, not a
// comparison aid. Capped at 5: the field pool this draws from grew to
// 28 in this same round, and an uncapped automatic selection against
// that many candidates could produce an unreadably wide table.
export function discriminatingFields(rows) {
  return SPEC_FIELDS.filter((field) => {
    const values = new Set(rows.map((row) => row.specValues[field.key] ?? null));
    return values.size > 1;
  }).slice(0, 5);
}

// When a node has an admin-chosen displayFields list, it overrides
// automatic column selection entirely - even a field that happens to be
// identical across every row in THIS particular row set stays shown if
// the admin picked it; manual control means manual control, not
// manual-control-with-an-automatic-veto. An empty array is a legitimate
// choice ("show zero extra columns"), distinct from null/undefined
// ("not configured yet - fall back").
export function pickDisplayFields(rows, displayFields) {
  if (displayFields != null) {
    const selected = new Set(displayFields);
    return SPEC_FIELDS.filter((field) => selected.has(field.key));
  }
  return discriminatingFields(rows);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/variantFields.test.js`
Expected: PASS — all cases, including every case from Tasks 2 and 4, green.

- [ ] **Step 5: Write the failing tests for `VariantsTable`'s new prop**

Add to `components/catalog/VariantsTable.test.jsx`:

```jsx
  it('uses an admin-selected displayFields list as columns, even for a field that does not vary', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        displayFields={['break_strength']}
        variants={[
          rawVariant({ id: 327, title: 'Half Inch', break_strength: 750 }),
          rawVariant({ id: 328, title: 'Five Eighths', break_strength: 750 }),
        ]}
      />
    );
    expect(screen.getAllByText('Break strength').length).toBeGreaterThan(0);
  });

  it('falls back to automatic column selection when displayFields is not provided', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({ id: 327, title: 'Half Inch', style: 'Standard Duty' }),
          rawVariant({ id: 328, title: 'Five Eighths', style: 'Heavy Duty' }),
        ]}
      />
    );
    expect(screen.getAllByText('Style').length).toBeGreaterThan(0);
  });

  it('shows zero extra columns when displayFields is an explicit empty array', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        displayFields={[]}
        variants={[
          rawVariant({ id: 327, title: 'Half Inch', style: 'Standard Duty' }),
          rawVariant({ id: 328, title: 'Five Eighths', style: 'Heavy Duty' }),
        ]}
      />
    );
    expect(screen.queryByText('Style')).not.toBeInTheDocument();
  });
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/VariantsTable.test.jsx`
Expected: FAIL — only these 3 new cases fail (`displayFields` isn't read anywhere yet); every pre-existing case in this file still passes, since the component's local `discriminatingFields` function hasn't been touched yet at this exact point.

- [ ] **Step 7: Remove the duplicated private copy; wire the component to `pickDisplayFields`**

In `components/catalog/VariantsTable.js`, change the import line:

```js
import { SPEC_FIELDS, formatSpecValue, extractPriceTiers, pickDisplayFields } from '@/lib/variantFields';
```

Delete the private `discriminatingFields` function (the one with the "Only columns where the value actually differs..." comment) entirely from this file — it now lives in `lib/variantFields.js`.

Change the component signature and the column-selection line:

```js
export function VariantsTable({ variants, currentVariantId, productSlug, displayFields }) {
  const [showAll, setShowAll] = useState(false);

  if (!variants || variants.length === 0) return null;

  const rows = variants.map(toTableRow);
  const visibleFields = pickDisplayFields(rows, displayFields);
```

(only the function signature's parameter list and the `discriminatingFields(rows)` call site change — everything else in the component body is unchanged.)

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/VariantsTable.test.jsx`
Expected: PASS — all cases, old and new, green.

- [ ] **Step 9: Commit**

```bash
git add lib/variantFields.js lib/variantFields.test.js components/catalog/VariantsTable.js components/catalog/VariantsTable.test.jsx
git commit -m "Move discriminatingFields into lib/variantFields.js (capped at 5); add pickDisplayFields; wire VariantsTable to it"
```

---

## Task 5: Thread `node.displayFields` through both call sites

**Files:**
- Modify: `components/catalog/ProductView.js`
- Modify: `components/catalog/ProductView.test.jsx`
- Modify: `components/catalog/CatalogNodeView.js`
- Modify: `components/catalog/CatalogNodeView.test.jsx`

**Interfaces:**
- Consumes: `VariantsTable`'s `displayFields` prop (Task 4); `node.displayFields` — the raw array (or absent/`null`) ESK_API's `GET /catalog-node` will include on each tree node once that repo's own plan ships; already safe to read unconditionally since `node?.displayFields` is simply `undefined` until then, which `pickDisplayFields` already treats as "fall back."

- [ ] **Step 1: Write the failing test for `ProductView.js`**

Add to `components/catalog/ProductView.test.jsx`:

```jsx
  it("uses the resolved node's displayFields for the Available Options table when set", () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          children: [
            {
              id: 18,
              name: 'Composite Strapping',
              children: [],
              displayFields: ['break_strength'],
              variants: [
                { id: 327, title: 'Composite Strapping', sku: 'CC40/2', break_strength: 750 },
                { id: 329, title: 'Other size', sku: 'CC50/2', break_strength: 750 },
              ],
            },
          ],
        },
      ],
    });
    render(<ProductView variantId="327" />);

    expect(screen.getAllByText('Break strength').length).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: FAIL — `ProductView.js` doesn't pass `displayFields` to `VariantsTable` yet, so the column never appears (both rows share `break_strength: 750`, which automatic selection would never surface on its own).

- [ ] **Step 3: Pass the prop**

In `components/catalog/ProductView.js`, change the `<VariantsTable ... />` call inside the "Available Options" section:

```jsx
          <VariantsTable
            variants={node.variants}
            currentVariantId={numericId}
            productSlug={slugify(node.name) || String(node.id)}
            displayFields={node.displayFields}
          />
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/catalog/ProductView.test.jsx`
Expected: PASS — all cases, including the new one, green.

- [ ] **Step 5: Write the failing test for `CatalogNodeView.js`**

Add to `components/catalog/CatalogNodeView.test.jsx`:

```jsx
  it("uses the resolved node's displayFields for the comparison table when set", () => {
    const treeWithDisplayFields = [
      {
        id: 9,
        name: 'CORD STRAPPING',
        images: [],
        variants: [],
        children: [
          {
            id: 18,
            name: 'Composite Strapping',
            images: [],
            children: [],
            displayFields: ['break_strength'],
            variants: [
              { id: 327, title: 'A', sku: 'X', break_strength: 750 },
              { id: 328, title: 'B', sku: 'Y', break_strength: 750 },
            ],
          },
        ],
      },
    ];
    useCatalogTree.mockReturnValue({ data: treeWithDisplayFields, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    expect(screen.getAllByText('Break strength').length).toBeGreaterThan(0);
  });
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run components/catalog/CatalogNodeView.test.jsx`
Expected: FAIL — same reason as Step 2, on the listing-page call site this time.

- [ ] **Step 7: Pass the prop**

In `components/catalog/CatalogNodeView.js`, change the `<VariantsTable ... />` call:

```jsx
            <VariantsTable
              variants={variants}
              productSlug={slugify(node.name) || String(node.id)}
              displayFields={node.displayFields}
            />
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run components/catalog/CatalogNodeView.test.jsx`
Expected: PASS — all cases, including the new one, green.

- [ ] **Step 9: Commit**

```bash
git add components/catalog/ProductView.js components/catalog/ProductView.test.jsx components/catalog/CatalogNodeView.js components/catalog/CatalogNodeView.test.jsx
git commit -m "Thread node.displayFields through both VariantsTable call sites"
```

---

## Task 6: Visual density tightening

**Files:**
- Modify: `components/catalog/ProductView.js`
- Modify: `components/catalog/CatalogNodeView.js`

**Interfaces:** none — pure Tailwind class changes, no behavior to assert, no test.

- [ ] **Step 1: Tighten `ProductView.js`'s section padding and grid gap**

Replace every occurrence of `py-16` with `py-10` in `components/catalog/ProductView.js` (4 occurrences: the loading state's `<main>`, the not-found state's `<main>`, the main content `<main>`, and the Options `<section>`).

Replace every occurrence of `gap-10` with `gap-8` in the same file (2 occurrences: the loading skeleton's grid, and the main content grid).

- [ ] **Step 2: Tighten `CatalogNodeView.js`'s section padding**

Replace every occurrence of `py-16` with `py-10` in `components/catalog/CatalogNodeView.js` (3 occurrences: the loading state's `<main>`, the not-found state's `<main>`, and the main content `<main>`).

- [ ] **Step 3: Run both files' tests to confirm nothing broke**

Run: `npx vitest run components/catalog/ProductView.test.jsx components/catalog/CatalogNodeView.test.jsx`
Expected: PASS — a spacing-only class change touches no text/role/attribute any existing assertion checks.

- [ ] **Step 4: Commit**

```bash
git add components/catalog/ProductView.js components/catalog/CatalogNodeView.js
git commit -m "Tighten product/listing page section padding and grid gaps"
```

---

## Task 7: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: every test file in the repo passes.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Confirm nothing still references the deleted/renamed names**

Run: `grep -rn "extractSpecs\b" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=.next`
Expected: no matches (every caller now uses `extractGroupedSpecs`).

- [ ] **Step 4: Manual verification against the real API, once ESK_API's and ESK_ADMIN's own plans for this feature have shipped**

With the dev server running against the real production (or local) API:
- A product page for a real multi-field-populated variant (e.g. the real "Composite Strapping" SKU CC50) shows multiple grouped sections (Material & Performance, Dimensions, Packaging & Shipping) with real values, not just the 9 fields shown before this round.
- Every Add/Show-all button across the catalog renders in the site's real accent/navy colors, not gray.
- On a leaf node an admin has NOT yet configured in ESK_ADMIN, the comparison table still shows automatically-selected columns (no empty-looking table).
- On a leaf node an admin HAS configured with specific fields, the comparison table shows exactly those fields as columns, in both the listing page and the product page's "Available Options" section.

- [ ] **Step 5: Nothing to commit**

This task is verification-only. If a real gap is found, fix it in a new commit here with a clear message before finishing.

---
