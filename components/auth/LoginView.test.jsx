import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
import { LoginView } from './LoginView';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));
vi.mock('@/hooks/useLogin', () => ({ useLogin: vi.fn() }));

describe('LoginView', () => {
  beforeEach(() => {
    push.mockClear();
    useAuthStore.setState({ user: null, isLoading: false });
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null });
  });

  it('shows validation errors for empty fields', async () => {
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<LoginView />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('logs in, stores the user, and redirects to the account page', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 1, email: 'jane@example.com' });
    useLogin.mockReturnValue({ mutateAsync, isPending: false });
    render(<LoginView />);

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(mutateAsync).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(useAuthStore.getState().user).toEqual({ id: 1, email: 'jane@example.com' });
    expect(push).toHaveBeenCalledWith('/account');
  });

  it('shows the server error message on failed login', async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Invalid password' } },
    });
    useLogin.mockReturnValue({ mutateAsync, isPending: false });
    render(<LoginView />);

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('prefills the email field with the remembered email', () => {
    useLoginMemoryStore.setState({ lastEmail: 'remembered@example.com', lastMethod: 'password' });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<LoginView />);
    expect(screen.getByLabelText('Email')).toHaveValue('remembered@example.com');
  });

  // zustand's persist middleware rehydrates from localStorage ASYNCHRONOUSLY
  // on the client (to avoid an SSR hydration mismatch) - lastEmail is still
  // null on this component's first render in a real browser, and only
  // becomes available a tick later. The test above sets lastEmail BEFORE
  // rendering, which never exercises that race - this one mounts first with
  // nothing remembered yet, then updates the store the way rehydration
  // actually would, proving the field catches up instead of staying stuck
  // on whatever defaultValues captured at mount.
  it('picks up the remembered email once it becomes available after mount (persist rehydration)', () => {
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<LoginView />);
    expect(screen.getByLabelText('Email')).toHaveValue('');

    // A zustand setState triggered outside a React event handler - exactly
    // what an async persist rehydration callback is - doesn't batch/flush
    // through React the way a click handler does; act() is what makes the
    // resulting re-render (and the effect it triggers) observable here.
    act(() => {
      useLoginMemoryStore.setState({ lastEmail: 'rehydrated@example.com', lastMethod: 'password' });
    });

    expect(screen.getByLabelText('Email')).toHaveValue('rehydrated@example.com');
  });

  it('shows a hint when the last login used Google', () => {
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: 'google' });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<LoginView />);
    expect(screen.getByText('You signed in with Google last time.')).toBeInTheDocument();
  });

  it('remembers the email and password method on successful login', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 1, email: 'jane@example.com' });
    useLogin.mockReturnValue({ mutateAsync, isPending: false });
    render(<LoginView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'jane@example.com',
      lastMethod: 'password',
    });
  });
});
