import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLogin } from './useLogin';

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

describe('useLogin', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts credentials and returns the safe user object', async () => {
    api.post.mockResolvedValue({
      data: { data: { id: 1, email: 'jane@example.com' }, message: 'Login successful' },
    });
    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: 'jane@example.com', password: 'secret' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'jane@example.com',
      password: 'secret',
    });
    expect(result.current.data).toEqual({ id: 1, email: 'jane@example.com' });
  });
});
