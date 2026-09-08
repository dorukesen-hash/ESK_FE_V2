import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useVariantsByIds } from './useVariantsByIds';

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useVariantsByIds', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.post.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('posts the sorted id list and shapes each result into a cart line', async () => {
    api.post.mockResolvedValue({
      data: [
        {
          id: 329,
          title: 'B Strap',
          sku: 'CC60/2',
          one_four_units: '60.00',
          pallet_pricing: '46.00',
          unit: 'Coils',
          variant_images: [{ image: { url: 'images/b.jpg' } }],
        },
      ],
    });

    const { result } = renderHook(() => useVariantsByIds([329, 327]), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith('/variant/id-list', { ids: [327, 329] });
    expect(result.current.data).toEqual([
      {
        id: 329,
        title: 'B Strap',
        sku: 'CC60/2',
        price: 60,
        palletPrice: 46,
        unit: 'Coils',
        image: 'https://cdn.eskpackaging.com/images/b.jpg',
        href: '/product/b-strap/329',
      },
    ]);
  });

  it('does not fetch when the id list is empty', () => {
    renderHook(() => useVariantsByIds([]), { wrapper });
    expect(api.post).not.toHaveBeenCalled();
  });
});
