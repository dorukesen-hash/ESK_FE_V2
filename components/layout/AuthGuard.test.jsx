import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

import { AuthGuard } from './AuthGuard';

describe('AuthGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it('renders nothing while auth state is loading', () => {
    useAuthStore.setState({ user: null, isLoading: true });
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects to /login when not loading and there is no user', () => {
    useAuthStore.setState({ user: null, isLoading: false });
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    );
    expect(replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when a user is present', () => {
    useAuthStore.setState({ user: { id: '1' }, isLoading: false });
    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
