import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRegister } from '@/hooks/useRegister';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { RegisterView } from './RegisterView';

vi.mock('@/hooks/useRegister', () => ({ useRegister: vi.fn() }));
vi.mock('@/hooks/useLogin', () => ({ useLogin: vi.fn() }));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('RegisterView', () => {
  beforeEach(() => {
    push.mockClear();
    useAuthStore.setState({ user: null, isLoading: false });
  });

  it('shows validation errors for empty fields', async () => {
    useRegister.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<RegisterView />);
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('registers, logs in with the same credentials, stores the user, and redirects to the account page', async () => {
    const registerMutateAsync = vi.fn().mockResolvedValue({ message: 'User created successfully.' });
    const loginMutateAsync = vi.fn().mockResolvedValue({ id: 1, email: 'jane@example.com' });
    useRegister.mockReturnValue({ mutateAsync: registerMutateAsync, isPending: false });
    useLogin.mockReturnValue({ mutateAsync: loginMutateAsync, isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(registerMutateAsync).toHaveBeenCalledWith({
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(loginMutateAsync).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(useAuthStore.getState().user).toEqual({ id: 1, email: 'jane@example.com' });
    expect(push).toHaveBeenCalledWith('/account');
  });

  it('shows the server error message when registration itself fails', async () => {
    const registerMutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });
    useRegister.mockReturnValue({ mutateAsync: registerMutateAsync, isPending: false });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('shows an error if registration succeeds but the follow-up login fails', async () => {
    const registerMutateAsync = vi.fn().mockResolvedValue({ message: 'User created successfully.' });
    const loginMutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Invalid password' } },
    });
    useRegister.mockReturnValue({ mutateAsync: registerMutateAsync, isPending: false });
    useLogin.mockReturnValue({ mutateAsync: loginMutateAsync, isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
