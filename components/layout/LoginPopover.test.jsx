import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
import { useLogin } from '@/hooks/useLogin';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useLogin', () => ({
  useLogin: vi.fn(),
}));

import { LoginPopover } from './LoginPopover';

describe('LoginPopover', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    useUIStore.setState({ isLoginModalOpen: false });
    useAuthStore.setState({ user: null, isLoading: false });
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null });
    mutateAsync.mockReset();
    useLogin.mockReturnValue({ mutateAsync, isPending: false });
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

  it('closes the modal and stores the user on successful submit', async () => {
    mutateAsync.mockResolvedValue({ id: '1', email: 'test@example.com' });
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => {
      expect(useUIStore.getState().isLoginModalOpen).toBe(false);
    });
    expect(useAuthStore.getState().user).toEqual({ id: '1', email: 'test@example.com' });
  });

  it('shows a server error message on failed submit', async () => {
    mutateAsync.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(useUIStore.getState().isLoginModalOpen).toBe(true);
  });

  it('prefills the email field with the remembered email', () => {
    useLoginMemoryStore.setState({ lastEmail: 'remembered@example.com', lastMethod: 'password' });
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    expect(screen.getByLabelText('Email')).toHaveValue('remembered@example.com');
  });

  it('shows a hint when the last login used Google', () => {
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: 'google' });
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    expect(screen.getByText('You signed in with Google last time.')).toBeInTheDocument();
  });

  it('remembers the email and password method on successful login', async () => {
    mutateAsync.mockResolvedValue({ id: '1', email: 'test@example.com' });
    useUIStore.setState({ isLoginModalOpen: true });
    render(<LoginPopover />);
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'test@example.com',
      lastMethod: 'password',
    });
  });
});
