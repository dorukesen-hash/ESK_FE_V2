import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCreateAddress } from './useCreateAddress';

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

describe('useCreateAddress', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('posts the new address', async () => {
    api.post.mockResolvedValue({ data: { id: 16, title: 'Warehouse' } });

    const { result } = renderHook(() => useCreateAddress(), { wrapper });
    result.current.mutate({ title: 'Warehouse', city: 'Garland' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith('/shippingprofiles', {
      title: 'Warehouse',
      city: 'Garland',
    });
  });
});
