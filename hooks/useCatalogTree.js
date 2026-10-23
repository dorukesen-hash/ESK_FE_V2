'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const CATALOG_TREE_QUERY_KEY = ['catalog-tree'];

export async function fetchCatalogTree() {
  const { data } = await api.get('/catalog-node');
  return data;
}

export function useCatalogTree() {
  return useQuery({
    queryKey: CATALOG_TREE_QUERY_KEY,
    queryFn: fetchCatalogTree,
    staleTime: 5 * 60 * 1000,
  });
}
