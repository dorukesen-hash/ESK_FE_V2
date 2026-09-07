import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCreateClaim } from './useCreateClaim';

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

describe('useCreateClaim', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('posts the claim to /claims', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { id: 1 } } });

    const { result } = renderHook(() => useCreateClaim(), { wrapper });
    result.current.mutate({ contactName: 'Jane', email: 'jane@example.com', description: 'Damaged box' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith('/claims', {
      contactName: 'Jane',
      email: 'jane@example.com',
      description: 'Damaged box',
    });
  });
});
