import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLogout } from './useLogout';

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

describe('useLogout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /auth/logout', async () => {
    api.post.mockResolvedValue({ data: { message: 'Logout successful!' } });

    const { result } = renderHook(() => useLogout(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });
});
