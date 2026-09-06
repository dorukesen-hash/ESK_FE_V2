import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCategories } from './useCategories';

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

describe('useCategories', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.get.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('maps the response down to id/name pairs, including subcategories and a representative image', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 12,
          name: 'EDGE PROTECTION',
          products: [],
          subcategories: [
            {
              id: 24,
              name: 'Corner Board',
              available: false,
              products: [],
              subcategory_images: [
                { image: { url: 'images/corner-board.jpg' } },
              ],
            },
          ],
        },
        { id: 7, name: 'Stretch Wrap', subcategories: [] },
      ],
    });

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/category');
    expect(result.current.data).toEqual([
      {
        id: 12,
        name: 'EDGE PROTECTION',
        image: 'https://cdn.eskpackaging.com/images/corner-board.jpg',
        subcategories: [{ id: 24, name: 'Corner Board' }],
      },
      { id: 7, name: 'Stretch Wrap', image: null, subcategories: [] },
    ]);
  });

  it('exposes an error state when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
