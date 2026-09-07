import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForgotPassword } from './useForgotPassword';

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

describe('useForgotPassword', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('posts the email and returns the (always-generic) message', async () => {
    api.post.mockResolvedValue({
      data: {
        message:
          'If that email address is in our system, we have sent a link to reset your password.',
      },
    });
    const { result } = renderHook(() => useForgotPassword(), { wrapper });

    result.current.mutate({ email: 'jane@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'jane@example.com',
    });
    expect(result.current.data.message).toMatch(/reset your password/);
  });
});
