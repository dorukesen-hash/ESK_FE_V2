import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useLogout';

let pathname = '/account';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

vi.mock('@/hooks/useLogout', () => ({
  useLogout: vi.fn(),
}));

import { AccountNav } from './AccountNav';

describe('AccountNav', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    pathname = '/account';
    mutateAsync.mockReset().mockResolvedValue({ message: 'Logout successful!' });
    useLogout.mockReturnValue({ mutateAsync, isPending: false });
    useAuthStore.setState({ user: { id: 1 }, isLoading: false });
  });

  it('highlights the active section', () => {
    pathname = '/account/orders';
    render(<AccountNav />);
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveClass('bg-ink');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveClass('bg-ink');
  });

  // AccountNav itself does not navigate on logout - every /account route is
  // wrapped in AuthGuard, which already redirects to /login the instant
  // `user` goes null. A second, separately-timed push() from here raced
  // AuthGuard's own redirect and wasn't reliably last (confirmed live: it
  // landed on /login about as often as /). Letting AuthGuard own the
  // redirect removes the race entirely.
  it('logs out and clears the user, leaving the redirect to AuthGuard', async () => {
    render(<AccountNav />);
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(mutateAsync).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
