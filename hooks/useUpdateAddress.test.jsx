import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUpdateAddress } from './useUpdateAddress';

vi.mock('@/lib/api', () => ({
  api: { put: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUpdateAddress', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('PUTs to the address id with the rest of the fields as the body', async () => {
    api.put.mockResolvedValue({ data: { message: 'address update successful' } });

    const { result } = renderHook(() => useUpdateAddress(), { wrapper });
    result.current.mutate({ id: 16, title: 'Warehouse (updated)' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.put).toHaveBeenCalledWith('/shippingprofiles/16', {
      title: 'Warehouse (updated)',
    });
  });
});
