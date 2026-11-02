'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { slugify } from '@/lib/slugify';

const PAGE_SIZE = 24;

// category/subcategory come from the API's real catalog_node ancestry
// (see ESK_API's resolveBreadcrumb), not a fixed two-level hierarchy -
// subcategory is null whenever the variant's own node IS the top-level
// department, and in principle category can be null too (an orphaned
// node), so neither can be dereferenced unconditionally here.
function toSearchResult(row) {
  return {
    id: row.id,
    title: row.title,
    sku: row.sku ?? null,
    categoryName: row.category?.name ?? null,
    subcategoryName: row.subcategory?.name ?? null,
    href: `/product/${slugify(row.title)}/${row.id}`,
  };
}

export function useSearch(query, { categoryId, subcategoryId, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: ['search', query ?? '', categoryId ?? null, subcategoryId ?? null],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get('/search', {
        params: {
          searchValue: query ?? '',
          limit: PAGE_SIZE,
          page: pageParam,
          ...(categoryId ? { categoryId } : {}),
          ...(subcategoryId ? { subcategoryId } : {}),
        },
      });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.rows.length, 0);
      return loaded < lastPage.count ? allPages.length : undefined;
    },
    select: (data) => ({
      count: data.pages[0]?.count ?? 0,
      results: data.pages.flatMap((page) => page.rows.map(toSearchResult)),
    }),
    staleTime: 60 * 1000,
    enabled,
  });
}
