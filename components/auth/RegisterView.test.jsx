import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRegister } from '@/hooks/useRegister';
import { RegisterView } from './RegisterView';

vi.mock('@/hooks/useRegister', () => ({ useRegister: vi.fn() }));

describe('RegisterView', () => {
  it('shows validation errors for empty fields', async () => {
    useRegister.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<RegisterView />);
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('registers and shows a success state linking to login (no auto-login)', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ message: 'User created successfully.' });
    useRegister.mockReturnValue({ mutateAsync, isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(await screen.findByRole('heading', { name: 'Account created' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toHaveAttribute('href', '/login');
  });

  it('shows the server error message when the email already exists', async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });
    useRegister.mockReturnValue({ mutateAsync, isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });
});
