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
