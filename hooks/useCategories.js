'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/cdn';

function firstSubcategoryImage(subcategories) {
  for (const subcategory of subcategories ?? []) {
    const url = subcategory.subcategory_images?.[0]?.image?.url;
    if (url) return resolveImageUrl(url);
  }
  return null;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/category');
      // The API returns the full category -> subcategory -> product -> variant
      // tree; the nav only needs id/name at each of the first two levels, plus
      // one representative image per category for homepage cards.
      return data.map((category) => ({
        id: category.id,
        name: category.name,
        image: firstSubcategoryImage(category.subcategories),
        subcategories: (category.subcategories ?? []).map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
        })),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
