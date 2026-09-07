import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRegister } from './useRegister';

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

describe('useRegister', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts name/surname/email/password', async () => {
    api.post.mockResolvedValue({ data: { message: 'User created successfully.' } });
    const { result } = renderHook(() => useRegister(), { wrapper });

    result.current.mutate({
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });
  });
});
