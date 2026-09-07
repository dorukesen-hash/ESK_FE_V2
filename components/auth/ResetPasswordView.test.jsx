import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useResetPassword } from '@/hooks/useResetPassword';
import { ResetPasswordView } from './ResetPasswordView';

vi.mock('@/hooks/useResetPassword', () => ({ useResetPassword: vi.fn() }));

describe('ResetPasswordView', () => {
  it('requires the confirmation to match the new password', async () => {
    useResetPassword.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, isSuccess: false });
    render(<ResetPasswordView token="abc123" />);

    await userEvent.type(screen.getByLabelText('New password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different123');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByText('Passwords must match')).toBeInTheDocument();
  });

  it('submits the token and new password, then shows a success state', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ message: 'Password updated successfully' });
    useResetPassword.mockReturnValue({ mutateAsync, isPending: false, isSuccess: false });
    render(<ResetPasswordView token="abc123" />);

    await userEvent.type(screen.getByLabelText('New password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(mutateAsync).toHaveBeenCalledWith({ token: 'abc123', password: 'password123' });
    expect(await screen.findByRole('heading', { name: 'Password updated' })).toBeInTheDocument();
  });

  it('shows a server error for an invalid or expired token', async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Token invalid or expired' } },
    });
    useResetPassword.mockReturnValue({ mutateAsync, isPending: false, isSuccess: false });
    render(<ResetPasswordView token="expired" />);

    await userEvent.type(screen.getByLabelText('New password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(await screen.findByText('Token invalid or expired')).toBeInTheDocument();
  });
});
