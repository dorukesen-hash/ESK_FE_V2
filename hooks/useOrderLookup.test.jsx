import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useOrderLookup } from './useOrderLookup';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useOrderLookup', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('looks up by email alone', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, orderNumber: '1001' }] });
    const { result } = renderHook(() => useOrderLookup(), { wrapper });

    const orders = await result.current.mutateAsync({ email: 'jane@example.com' });

    expect(api.get).toHaveBeenCalledWith('/orders/lookup', {
      params: { email: 'jane@example.com' },
    });
    expect(orders).toEqual([{ id: 1, orderNumber: '1001' }]);
  });

  it('includes orderNumber in the params only when given', async () => {
    api.get.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useOrderLookup(), { wrapper });

    await result.current.mutateAsync({ email: 'jane@example.com', orderNumber: '1001' });

    expect(api.get).toHaveBeenCalledWith('/orders/lookup', {
      params: { email: 'jane@example.com', orderNumber: '1001' },
    });
  });
});
