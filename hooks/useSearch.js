'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slugify';

function toSearchResult(row) {
  const categorySlug = slugify(row.category.name);
  const subcategorySlug = slugify(row.subcategory.name);
  return {
    id: row.id,
    title: row.title,
    sku: row.stock ?? null,
    categoryName: row.category.name,
    subcategoryName: row.subcategory.name,
    categoryHref: `/category/${categorySlug}`,
    subcategoryHref: `/category/${categorySlug}/${subcategorySlug}`,
    href: `/product/${slugify(row.title)}/${row.id}`,
  };
}

export function useSearch(query) {
  return useQuery({
    queryKey: ['search', query ?? ''],
    queryFn: async () => {
      const { data } = await api.get('/search', {
        params: { searchValue: query ?? '' },
      });
      return data;
    },
    select: (data) => ({
      count: data.count,
      results: data.rows.map(toSearchResult),
    }),
    staleTime: 60 * 1000,
  });
}
