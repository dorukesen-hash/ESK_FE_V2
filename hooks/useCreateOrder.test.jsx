import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCreateOrder } from './useCreateOrder';

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCreateOrder', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts the order payload and returns the created order', async () => {
    api.post.mockResolvedValue({ data: { orderNumber: '100001' } });
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    const order = {
      billing: { email: 'a@b.com' },
      items: [{ variantId: 327, quantity: 1 }],
      recipient: { PostalCode: '75201' },
      shipping: { price: 12.5 },
      paymentIntent: { id: 'pi_123', amount: 8050 },
    };
    result.current.mutate(order);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/orders', order);
    expect(result.current.data).toEqual({ orderNumber: '100001' });
  });
});
