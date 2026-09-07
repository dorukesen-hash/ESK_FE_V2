'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/cdn';

const PRICE_TIER_FIELDS = [
  { key: 'one_four_units', label: '1-4 units' },
  { key: 'five_nine_units', label: '5-9 units' },
  { key: 'ten_plus_units', label: '10+ units' },
  { key: 'pallet_pricing', label: 'Full pallet' },
];

const BULLET_FIELDS = ['bullet_1', 'bullet_2', 'bullet_3', 'bullet_4', 'bullet_5', 'bullet_6'];

// A handful of the ~90 raw columns are meaningful, human-facing
// specifications; showing all of them would be noise. This is a curated
// subset, skipped per-row when the variant has no value for it.
const SPEC_FIELDS = [
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

function toVariantDetail(variant) {
  const priceTiers = PRICE_TIER_FIELDS.map((tier) => ({
    label: tier.label,
    price: variant[tier.key] ? Number(variant[tier.key]) : null,
  })).filter((tier) => tier.price != null);

  const bullets = BULLET_FIELDS.map((key) => variant[key]).filter(Boolean);

  const specs = SPEC_FIELDS.map((field) => {
    const value = variant[field.key];
    if (value == null || value === '') return null;
    const unit = field.unitKey ? variant[field.unitKey] : '';
    return { label: field.label, value: unit ? `${value} ${unit}` : String(value) };
  }).filter(Boolean);

  const images = (variant.variant_images ?? [])
    .map((entry) => resolveImageUrl(entry.image?.url))
    .filter(Boolean);

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.stock ?? null,
    description: variant.description ?? null,
    unit: variant.unit ?? null,
    priceTiers,
    bullets,
    specs,
    images,
    categoryId: variant.categoryId ?? null,
    subcategoryId: variant.subcategoryId ?? null,
    productId: variant.productId ?? null,
  };
}

export function useVariant(variantId) {
  return useQuery({
    queryKey: ['variant', variantId],
    queryFn: async () => {
      const { data } = await api.get(`/variant/${variantId}`);
      return data;
    },
    select: toVariantDetail,
    enabled: variantId != null,
    staleTime: 5 * 60 * 1000,
  });
}
