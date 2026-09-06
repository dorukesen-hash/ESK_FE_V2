'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/category');
      // The API returns the full category -> subcategory -> product -> variant
      // tree; the nav only needs id/name at each of the first two levels.
      return data.map((category) => ({
        id: category.id,
        name: category.name,
        subcategories: (category.subcategories ?? []).map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
        })),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
