'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/category');
      // The API returns the full category -> subcategory -> product -> variant
      // tree; the nav only needs top-level id/name.
      return data.map((category) => ({ id: category.id, name: category.name }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
