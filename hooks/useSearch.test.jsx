import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSearch } from './useSearch';

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

describe('useSearch', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('sends the query as searchValue and shapes each row', async () => {
    api.get.mockResolvedValue({
      data: {
        count: 1,
        rows: [
          {
            id: 327,
            title: 'Composite Strapping',
            sku: 'CC40/2',
            category: { id: 9, name: 'CORD STRAPPING' },
            subcategory: { id: 18, name: 'Composite Strapping' },
          },
        ],
      },
    });

    const { result } = renderHook(() => useSearch('strap'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/search', {
      params: { searchValue: 'strap', limit: 24, page: 0 },
    });
    expect(result.current.data).toEqual({
      count: 1,
      results: [
        {
          id: 327,
          title: 'Composite Strapping',
          sku: 'CC40/2',
          categoryName: 'CORD STRAPPING',
          subcategoryName: 'Composite Strapping',
          categoryHref: '/category/cord-strapping',
          subcategoryHref: '/category/cord-strapping/composite-strapping',
          href: '/product/composite-strapping/327',
        },
      ],
    });
  });

  it('sends an empty searchValue when no query is given', async () => {
    api.get.mockResolvedValue({ data: { count: 0, rows: [] } });
    const { result } = renderHook(() => useSearch(undefined), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/search', {
      params: { searchValue: '', limit: 24, page: 0 },
    });
  });

  it('fetches the next page and appends its rows once more results remain', async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          count: 30,
          rows: [{ id: 1, title: 'First', sku: 'A1', category: { name: 'Cat' }, subcategory: { name: 'Sub' } }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          count: 30,
          rows: [{ id: 2, title: 'Second', sku: 'A2', category: { name: 'Cat' }, subcategory: { name: 'Sub' } }],
        },
      });

    const { result } = renderHook(() => useSearch('strap'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data.results).toHaveLength(2));

    expect(api.get).toHaveBeenLastCalledWith('/search', {
      params: { searchValue: 'strap', limit: 24, page: 1 },
    });
    expect(result.current.data.results.map((r) => r.id)).toEqual([1, 2]);
  });

  it('reports no next page once every row has been loaded', async () => {
    api.get.mockResolvedValue({
      data: {
        count: 1,
        rows: [{ id: 1, title: 'Only', sku: 'A1', category: { name: 'Cat' }, subcategory: { name: 'Sub' } }],
      },
    });
    const { result } = renderHook(() => useSearch('strap'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});
