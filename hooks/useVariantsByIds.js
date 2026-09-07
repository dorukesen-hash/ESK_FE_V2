'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';

function toCartLine(variant) {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.stock ?? null,
    price: variant.one_four_units ? Number(variant.one_four_units) : null,
    palletPrice: variant.pallet_pricing ? Number(variant.pallet_pricing) : null,
    unit: variant.unit ?? null,
    image: resolveImageUrl(variant.variant_images?.[0]?.image?.url) ?? null,
    href: `/product/${slugify(variant.title)}/${variant.id}`,
  };
}

export function useVariantsByIds(ids) {
  const sortedIds = [...ids].sort((a, b) => a - b);

  return useQuery({
    queryKey: ['variants', sortedIds],
    queryFn: async () => {
      const { data } = await api.post('/variant/id-list', { ids: sortedIds });
      return data;
    },
    select: (data) => data.map(toCartLine),
    enabled: sortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
