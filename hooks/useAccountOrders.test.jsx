import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAccountOrders } from './useAccountOrders';

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

describe('useAccountOrders', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns the orders array', async () => {
    api.get.mockResolvedValue({
      data: { orders: [{ id: 1, orderNumber: 'ESK-1001' }] },
    });

    const { result } = renderHook(() => useAccountOrders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/account/orders');
    expect(result.current.data).toEqual([{ id: 1, orderNumber: 'ESK-1001' }]);
  });
});
