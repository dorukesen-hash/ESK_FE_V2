import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useResetPassword } from './useResetPassword';

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

describe('useResetPassword', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts the new password to the token-scoped endpoint', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password updated successfully' } });
    const { result } = renderHook(() => useResetPassword(), { wrapper });

    result.current.mutate({ token: 'abc123', password: 'newpass123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password/abc123', {
      password: 'newpass123',
    });
  });
});
