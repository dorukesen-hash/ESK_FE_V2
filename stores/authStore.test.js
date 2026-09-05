import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it('starts with isLoading true and no user', () => {
    expect(useAuthStore.getState()).toMatchObject({ user: null, isLoading: true });
  });

  it('setUser stores the user and clears isLoading', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com' });
    expect(useAuthStore.getState()).toEqual({
      user: { id: '1', email: 'a@b.com' },
      isLoading: false,
      setUser: expect.any(Function),
      clearUser: expect.any(Function),
    });
  });

  it('clearUser resets the user and clears isLoading', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com' });
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
