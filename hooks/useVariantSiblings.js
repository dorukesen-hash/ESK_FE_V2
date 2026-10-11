'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SPEC_FIELDS, formatSpecValue, extractPriceTiers } from '@/lib/variantFields';

const PREVIEW_LIMIT = 20;
const ALL_LIMIT = 1000;

function toSiblingRow(variant) {
  const specValues = {};
  for (const field of SPEC_FIELDS) {
    specValues[field.key] = formatSpecValue(variant, field);
  }

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    // The 3 quantity-tier prices (1-4 / 5-9 / 10+ units) - "Full pallet" is
    // excluded here since it's not a column, it's auto-applied on add once
    // the chosen quantity reaches unitsPerPallet.
    priceTiers: extractPriceTiers(variant).filter((tier) => tier.label !== 'Full pallet'),
    palletPrice: variant.pallet_pricing != null ? Number(variant.pallet_pricing) : null,
    unitsPerPallet: variant.units_per_pallet != null ? Number(variant.units_per_pallet) : null,
    specValues,
  };
}

// `all=true` re-fetches with a practically-unbounded limit instead of
// paging incrementally - the table's "Load all" action is a single step,
// not a repeatable "load more".
export function useVariantSiblings(variantId, { all = false } = {}) {
  return useQuery({
    queryKey: ['variant-siblings', variantId, all],
    queryFn: async () => {
      const { data } = await api.get(`/variant/${variantId}/siblings`, {
        params: { limit: all ? ALL_LIMIT : PREVIEW_LIMIT },
      });
      return data;
    },
    select: (data) => ({
      count: data.count,
      level: data.level,
      levelName: data.levelName,
      rows: data.rows.map(toSiblingRow),
    }),
    enabled: variantId != null,
    staleTime: 5 * 60 * 1000,
  });
}
