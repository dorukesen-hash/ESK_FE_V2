import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUIStore } from '@/stores/uiStore';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { LoginPopover } from './LoginPopover';

describe('LoginPopover', () => {
  beforeEach(() => {
    useUIStore.setState({ isLoginModalOpen: false });
  });

  it('renders nothing when closed', () => {
    render(<LoginPopover />);
    expect(screen.queryByText('Log in')).not.toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('closes the modal on successful submit', async () => {
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => {
      expect(useUIStore.getState().isLoginModalOpen).toBe(false);
    });
  });
});
