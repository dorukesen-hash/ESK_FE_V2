import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCreatePaymentIntent } from './useCreatePaymentIntent';

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

describe('useCreatePaymentIntent', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts items/shipping and returns the client secret', async () => {
    api.post.mockResolvedValue({ data: { clientSecret: 'pi_123_secret' } });
    const { result } = renderHook(() => useCreatePaymentIntent(), { wrapper });

    result.current.mutate({
      items: [{ variantId: 327, quantity: 2 }],
      shipping: { price: 12.5 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/stripe/create-payment-intent', {
      items: [{ variantId: 327, quantity: 2 }],
      shipping: { price: 12.5 },
    });
    expect(result.current.data).toEqual({ clientSecret: 'pi_123_secret' });
  });
});
