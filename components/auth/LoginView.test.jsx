import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
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
});
