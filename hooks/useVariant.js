'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/cdn';
import { extractPriceTiers, extractBullets, extractGroupedSpecs } from '@/lib/variantFields';

function toVariantDetail(variant) {
  const images = (variant.variant_images ?? [])
    .map((entry) => resolveImageUrl(entry.image?.url))
    .filter(Boolean);

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    description: variant.description ?? null,
    unit: variant.unit ?? null,
    priceTiers: extractPriceTiers(variant),
    bullets: extractBullets(variant),
    specs: extractGroupedSpecs(variant),
    images,
    nodeId: variant.nodeId ?? null,
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
