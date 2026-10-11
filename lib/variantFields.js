// Shared field definitions + extraction helpers for the raw Variant payload
// the API returns. Used by both the single-variant detail hook (useVariant)
// and the sibling-variants table hook (useVariantSiblings) so the two never
// drift on what a "price tier" or "spec" means.

export const PRICE_TIER_FIELDS = [
  { key: 'one_four_units', label: '1-4 units' },
  { key: 'five_nine_units', label: '5-9 units' },
  { key: 'ten_plus_units', label: '10+ units' },
  { key: 'pallet_pricing', label: 'Full pallet' },
];

export const BULLET_FIELDS = ['bullet_1', 'bullet_2', 'bullet_3', 'bullet_4', 'bullet_5', 'bullet_6'];

// A handful of the ~90 raw columns are meaningful, human-facing
// specifications; showing all of them would be noise. This is a curated
// subset, skipped per-row/per-column when nothing in the set has a value.
export const SPEC_FIELDS = [
  { key: 'size', label: 'Size' },
  { key: 'color', label: 'Color' },
  { key: 'material_type', label: 'Material' },
  { key: 'style', label: 'Style' },
  { key: 'unit', label: 'Sold as' },
  { key: 'quantity_case', label: 'Units per case' },
  { key: 'units_per_pallet', label: 'Units per pallet' },
  { key: 'break_strength', label: 'Break strength', unitKey: 'break_strength_unit_of_measure' },
  { key: 'core_diameter', label: 'Core diameter', unitKey: 'core_diameter_unit_of_measure' },
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

export function extractSpecs(variant) {
  return SPEC_FIELDS.map((field) => {
    const value = formatSpecValue(variant, field);
    return value ? { label: field.label, value } : null;
  }).filter(Boolean);
}
