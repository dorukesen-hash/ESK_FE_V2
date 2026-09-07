import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useDeleteAddress } from './useDeleteAddress';

vi.mock('@/lib/api', () => ({
  api: { delete: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDeleteAddress', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('DELETEs the address by id', async () => {
    api.delete.mockResolvedValue({ data: { message: 'address delete successful' } });

    const { result } = renderHook(() => useDeleteAddress(), { wrapper });
    result.current.mutate(16);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.delete).toHaveBeenCalledWith('/shippingprofiles/16');
  });
});
