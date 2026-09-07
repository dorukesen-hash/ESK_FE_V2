import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForgotPassword } from '@/hooks/useForgotPassword';
import { ForgotPasswordView } from './ForgotPasswordView';

vi.mock('@/hooks/useForgotPassword', () => ({ useForgotPassword: vi.fn() }));

describe('ForgotPasswordView', () => {
  it('shows a validation error for an empty email', async () => {
    useForgotPassword.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
    });
    render(<ForgotPasswordView />);
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('shows the generic confirmation message the API returns on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    useForgotPassword.mockReturnValue({
      mutateAsync,
      isPending: false,
      isSuccess: true,
      data: {
        message:
          'If that email address is in our system, we have sent a link to reset your password.',
      },
    });
    render(<ForgotPasswordView />);
    expect(
      screen.getByText(
        'If that email address is in our system, we have sent a link to reset your password.'
      )
    ).toBeInTheDocument();
  });
});
