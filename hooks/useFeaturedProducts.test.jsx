import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFeaturedProducts } from './useFeaturedProducts';

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

describe('useFeaturedProducts', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.get.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('collects featured variants attached directly to a node, ordered by position', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          images: [],
          variants: [],
          children: [
            {
              id: 18,
              name: 'Composite Strapping',
              images: [{ image: { url: 'images/composite.jpg' } }],
              variants: [
                { id: 329, title: 'B', sku: 'CC60/2', featured: true, featured_position: 1, one_four_units: '60.00', unit: 'Coils' },
                { id: 327, title: 'A', sku: 'CC40/2', featured: true, featured_position: 0, one_four_units: '68.00', unit: 'Coils' },
                { id: 999, title: 'Not featured', featured: false },
              ],
              children: [],
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/catalog-node');
    expect(result.current.data).toEqual([
      {
        id: 327,
        title: 'A',
        sku: 'CC40/2',
        price: 68,
        unit: 'Coils',
        position: 0,
        image: 'https://cdn.eskpackaging.com/images/composite.jpg',
        href: '/product/composite-strapping/327',
      },
      {
        id: 329,
        title: 'B',
        sku: 'CC60/2',
        price: 60,
        unit: 'Coils',
        position: 1,
        image: 'https://cdn.eskpackaging.com/images/composite.jpg',
        href: '/product/composite-strapping/329',
      },
    ]);
  });

  it('collects featured variants nested several levels deep, using the image/slug of the node the variant is attached to', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'BOXES',
          images: [{ image: { url: 'images/sub.jpg' } }],
          variants: [],
          children: [
            {
              id: 31,
              name: 'Corrugated Boxes',
              images: [{ image: { url: 'images/sub.jpg' } }],
              variants: [],
              children: [
                {
                  id: 4,
                  name: 'RSC Boxes',
                  images: [{ image: { url: 'images/product.jpg' } }],
                  variants: [
                    { id: 642, title: '4x4x4', sku: 'BX-4x4x4', featured: true, one_four_units: '1.20', unit: 'Each' },
                  ],
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: 642,
        title: '4x4x4',
        sku: 'BX-4x4x4',
        price: 1.2,
        unit: 'Each',
        position: 0,
        image: 'https://cdn.eskpackaging.com/images/product.jpg',
        href: '/product/rsc-boxes/642',
      },
    ]);
  });

  it('returns an empty list when nothing is featured', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'BOXES',
          images: [],
          variants: [],
          children: [{ id: 31, name: 'Corrugated Boxes', images: [], variants: [], children: [] }],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('caps the result at 8 even when more variants are marked featured', async () => {
    const variants = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `Variant ${i + 1}`,
      sku: `SKU-${i + 1}`,
      featured: true,
      featured_position: i,
      one_four_units: '10.00',
      unit: 'Each',
    }));
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'BOXES',
          images: [],
          variants: [],
          children: [{ id: 31, name: 'Corrugated Boxes', images: [], variants, children: [] }],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(8);
    expect(result.current.data.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
