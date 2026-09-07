import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAccountInvoices } from './useAccountInvoices';

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

describe('useAccountInvoices', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns the invoices array', async () => {
    api.get.mockResolvedValue({
      data: { invoices: [{ id: 1, documentNumber: 'INV-1001' }] },
    });

    const { result } = renderHook(() => useAccountInvoices(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/account/invoices');
    expect(result.current.data).toEqual([{ id: 1, documentNumber: 'INV-1001' }]);
  });
});
