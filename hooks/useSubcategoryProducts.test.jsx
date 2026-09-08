import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSubcategoryProducts } from './useSubcategoryProducts';

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

describe('useSubcategoryProducts', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.get.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('lists variants nested directly under the subcategory and under its products', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          subcategories: [
            {
              id: 18,
              name: 'Composite Strapping',
              subcategory_images: [{ image: { url: 'images/sub.jpg' } }],
              variants: [
                { id: 327, title: 'A', sku: 'CC40/2', one_four_units: '68.00', unit: 'Coils' },
              ],
              products: [
                {
                  name: 'Wire Buckle',
                  product_images: [{ image: { url: 'images/product.jpg' } }],
                  variants: [
                    { id: 405, title: 'B', sku: 'WB1', one_four_units: '5.00', unit: 'Each' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const { result } = renderHook(
      () => useSubcategoryProducts('cord-strapping', 'composite-strapping'),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      categoryId: 9,
      categoryName: 'CORD STRAPPING',
      id: 18,
      name: 'Composite Strapping',
      products: [
        {
          id: 327,
          title: 'A',
          sku: 'CC40/2',
          price: 68,
          unit: 'Coils',
          image: 'https://cdn.eskpackaging.com/images/sub.jpg',
          href: '/product/composite-strapping/327',
        },
        {
          id: 405,
          title: 'B',
          sku: 'WB1',
          price: 5,
          unit: 'Each',
          image: 'https://cdn.eskpackaging.com/images/product.jpg',
          href: '/product/wire-buckle/405',
        },
      ],
    });
  });

  it('returns null when the category or subcategory slug does not match', async () => {
    api.get.mockResolvedValue({
      data: [{ id: 9, name: 'CORD STRAPPING', subcategories: [] }],
    });
    const { result } = renderHook(
      () => useSubcategoryProducts('cord-strapping', 'nonexistent'),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
