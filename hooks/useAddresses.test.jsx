import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAddresses } from './useAddresses';

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

describe('useAddresses', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns the bare address array', async () => {
    api.get.mockResolvedValue({
      data: [{ id: 16, title: 'Warehouse' }],
    });

    const { result } = renderHook(() => useAddresses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/shippingprofiles');
    expect(result.current.data).toEqual([{ id: 16, title: 'Warehouse' }]);
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useAddresses({ enabled: false }), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
  });
});
