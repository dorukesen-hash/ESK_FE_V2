import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useShippingOptions } from './useShippingOptions';

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

describe('useShippingOptions', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts the recipient and items and returns the options array', async () => {
    api.post.mockResolvedValue({ data: { options: [{ carrierName: 'UPS' }] } });
    const { result } = renderHook(() => useShippingOptions(), { wrapper });

    result.current.mutate({
      recipient: { PostalCode: '75201' },
      items: [{ variantId: 327, quantity: 2 }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/services/combined-shipping-options', {
      recipient: { PostalCode: '75201' },
      items: [{ variantId: 327, quantity: 2 }],
    });
    expect(result.current.data).toEqual([{ carrierName: 'UPS' }]);
  });

  it('returns an empty array when the response has no options', async () => {
    api.post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useShippingOptions(), { wrapper });
    result.current.mutate({ recipient: {}, items: [] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
