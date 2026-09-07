import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AuthBootstrap } from './AuthBootstrap';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

describe('AuthBootstrap', () => {
  beforeEach(() => {
    api.get.mockReset();
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it('sets the user and clears isLoading when a session cookie is valid', async () => {
    api.get.mockResolvedValue({ data: { userObject: { id: 1, email: 'jane@example.com' } } });
    render(<AuthBootstrap />);

    await waitFor(() => expect(useAuthStore.getState().isLoading).toBe(false));
    expect(api.get).toHaveBeenCalledWith('/user/user-details');
    expect(useAuthStore.getState().user).toEqual({ id: 1, email: 'jane@example.com' });
  });

  it('clears the user and isLoading when there is no valid session', async () => {
    api.get.mockRejectedValue(new Error('401'));
    render(<AuthBootstrap />);

    await waitFor(() => expect(useAuthStore.getState().isLoading).toBe(false));
    expect(useAuthStore.getState().user).toBeNull();
  });
});
