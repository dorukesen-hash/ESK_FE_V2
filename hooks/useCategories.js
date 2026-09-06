'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/cdn';

// Shared with useFeaturedProducts: same queryKey + queryFn means TanStack
// Query dedupes the fetch across both hooks (the raw payload includes the
// full category -> subcategory -> product -> variant tree and is slow/heavy
// - see ESK_API TODO.md - so it's fetched once and reshaped per-consumer via
// `select`, never fetched twice).
export const CATALOG_QUERY_KEY = ['categories'];

export async function fetchCatalog() {
  const { data } = await api.get('/category');
  return data;
}

function firstSubcategoryImage(subcategories) {
  for (const subcategory of subcategories ?? []) {
    const url = subcategory.subcategory_images?.[0]?.image?.url;
    if (url) return resolveImageUrl(url);
  }
  return null;
}

function toCategorySummaries(categories) {
  // The nav/homepage only need id/name at each of the first two levels,
  // plus one representative image per category for homepage cards.
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    image: firstSubcategoryImage(category.subcategories),
    subcategories: (category.subcategories ?? []).map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
    })),
  }));
}

export function useCategories() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: fetchCatalog,
    select: toCategorySummaries,
    staleTime: 5 * 60 * 1000,
  });
}
