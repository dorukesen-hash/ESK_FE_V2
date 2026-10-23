import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCatalogTree } from './useCatalogTree';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCatalogTree', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('fetches the catalog_node tree and returns it as-is', async () => {
    const tree = [{ id: 1, name: 'Boxes', children: [], variants: [], images: [] }];
    api.get.mockResolvedValue({ data: tree });

    const { result } = renderHook(() => useCatalogTree(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/catalog-node');
    expect(result.current.data).toEqual(tree);
  });

  it('exposes an error state when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useCatalogTree(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
