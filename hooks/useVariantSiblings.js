'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SPEC_FIELDS, formatSpecValue } from '@/lib/variantFields';

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
    basePrice: variant.one_four_units != null ? Number(variant.one_four_units) : null,
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
