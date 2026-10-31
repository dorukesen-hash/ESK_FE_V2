import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useVariant } from './useVariant';

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

describe('useVariant', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.get.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('shapes the raw variant into price tiers, bullets, specs and images', async () => {
    api.get.mockResolvedValue({
      data: {
        id: 327,
        title: 'Composite Strapping',
        sku: 'CC40/2',
        description: 'A strap.',
        unit: 'Coils',
        one_four_units: '68.00',
        five_nine_units: '66.00',
        ten_plus_units: null,
        pallet_pricing: '53.00',
        bullet_1: 'Strong',
        bullet_2: '',
        bullet_3: null,
        size: '1/2" x 3610\'',
        color: 'White',
        material_type: 'Polyester',
        break_strength: 530,
        break_strength_unit_of_measure: 'LB',
        variant_images: [{ image: { url: 'images/a.jpg' } }],
        nodeId: 18,
        categoryId: 9,
        subcategoryId: 18,
        productId: null,
      },
    });

    const { result } = renderHook(() => useVariant(327), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/variant/327');
    expect(result.current.data).toEqual({
      id: 327,
      title: 'Composite Strapping',
      sku: 'CC40/2',
      description: 'A strap.',
      unit: 'Coils',
      priceTiers: [
        { label: '1-4 units', price: 68 },
        { label: '5-9 units', price: 66 },
        { label: 'Full pallet', price: 53 },
      ],
      bullets: ['Strong'],
      specs: [
        {
          group: 'Material & Performance',
          specs: [
            { label: 'Color', value: 'White' },
            { label: 'Material', value: 'Polyester' },
            { label: 'Sold as', value: 'Coils' },
            { label: 'Break strength', value: '530 LB' },
          ],
        },
        {
          group: 'Dimensions',
          specs: [{ label: 'Size', value: '1/2" x 3610\'' }],
        },
      ],
      images: ['https://cdn.eskpackaging.com/images/a.jpg'],
      nodeId: 18,
      categoryId: 9,
      subcategoryId: 18,
      productId: null,
    });
  });

  it('does not fetch when no variantId is given', () => {
    renderHook(() => useVariant(undefined), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });
});
