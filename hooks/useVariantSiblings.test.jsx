import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useVariantSiblings } from './useVariantSiblings';

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

const rawResponse = {
  count: 2,
  level: 'subcategory',
  levelName: 'Corrugated Boxes',
  rows: [
    {
      id: 870,
      title: '4 x 4 x 4 RSC - ECT32 - Kraft',
      sku: 'BOX-444',
      one_four_units: '12.00',
      five_nine_units: '11.00',
      ten_plus_units: '10.00',
      pallet_pricing: '400.00',
      units_per_pallet: 50,
      size: '4x4x4',
      color: null,
    },
    {
      id: 871,
      title: '5 x 5 x 5 RSC - ECT32 - Kraft',
      sku: 'BOX-555',
      one_four_units: '14.00',
      pallet_pricing: null,
      units_per_pallet: null,
      size: '5x5x5',
      color: null,
    },
  ],
};

describe('useVariantSiblings', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('requests the preview page by default and shapes each row', async () => {
    api.get.mockResolvedValue({ data: rawResponse });

    const { result } = renderHook(() => useVariantSiblings(870), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/variant/870/siblings', { params: { limit: 20 } });
    expect(result.current.data).toEqual({
      count: 2,
      level: 'subcategory',
      levelName: 'Corrugated Boxes',
      rows: [
        {
          id: 870,
          title: '4 x 4 x 4 RSC - ECT32 - Kraft',
          sku: 'BOX-444',
          basePrice: 12,
          palletPrice: 400,
          unitsPerPallet: 50,
          specValues: {
            size: '4x4x4',
            color: null,
            material_type: null,
            style: null,
            unit: null,
            quantity_case: null,
            units_per_pallet: '50',
            break_strength: null,
            core_diameter: null,
          },
        },
        {
          id: 871,
          title: '5 x 5 x 5 RSC - ECT32 - Kraft',
          sku: 'BOX-555',
          basePrice: 14,
          palletPrice: null,
          unitsPerPallet: null,
          specValues: {
            size: '5x5x5',
            color: null,
            material_type: null,
            style: null,
            unit: null,
            quantity_case: null,
            units_per_pallet: null,
            break_strength: null,
            core_diameter: null,
          },
        },
      ],
    });
  });

  it('requests the full set when all is true', async () => {
    api.get.mockResolvedValue({ data: rawResponse });
    const { result } = renderHook(() => useVariantSiblings(870, { all: true }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/variant/870/siblings', { params: { limit: 1000 } });
  });

  it('does not fetch when no variantId is given', () => {
    renderHook(() => useVariantSiblings(undefined), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });
});
