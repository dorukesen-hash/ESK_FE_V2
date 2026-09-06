import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCategories } from './useCategories';

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

describe('useCategories', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('maps the response down to id/name pairs', async () => {
    api.get.mockResolvedValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', subcategories: [], products: [] },
        { id: 7, name: 'Stretch Wrap', subcategories: [] },
      ],
    });

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/category');
    expect(result.current.data).toEqual([
      { id: 12, name: 'EDGE PROTECTION' },
      { id: 7, name: 'Stretch Wrap' },
    ]);
  });

  it('exposes an error state when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
