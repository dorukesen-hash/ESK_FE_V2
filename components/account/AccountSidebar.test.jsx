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

import { AccountSidebar } from './AccountSidebar';

describe('AccountSidebar', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    pathname = '/account';
    mutateAsync.mockReset().mockResolvedValue({ message: 'Logout successful!' });
    useLogout.mockReturnValue({ mutateAsync, isPending: false });
    useAuthStore.setState({
      user: { id: 1, name: 'Jane', surname: 'Doe', email: 'jane@example.com' },
      isLoading: false,
    });
  });

  it('shows the user initials, name, and email', () => {
    render(<AccountSidebar />);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('falls back to the email initial when no name is set', () => {
    useAuthStore.setState({ user: { id: 1, email: 'jane@example.com' }, isLoading: false });
    render(<AccountSidebar />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('highlights the active section', () => {
    pathname = '/account/orders';
    render(<AccountSidebar />);
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveClass('bg-ink');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveClass('bg-ink');
  });

  it('logs out and clears the user, leaving the redirect to AuthGuard', async () => {
    render(<AccountSidebar />);
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(mutateAsync).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
