import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/stores/authStore';
import { useCreateClaim } from '@/hooks/useCreateClaim';
import { ClaimForm } from './ClaimForm';

vi.mock('@/hooks/useCreateClaim', () => ({
  useCreateClaim: vi.fn(),
}));

describe('ClaimForm', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    mutateAsync.mockReset().mockResolvedValue({ success: true });
    useCreateClaim.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
    useAuthStore.setState({
      user: { name: 'Jane', surname: 'Doe', email: 'jane@example.com' },
      isLoading: false,
    });
  });

  it('pre-fills name and email from the logged-in user', () => {
    render(<ClaimForm />);
    expect(screen.getByLabelText('Your name')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
  });

  it('validates required fields', async () => {
    useAuthStore.setState({ user: null, isLoading: false });
    render(<ClaimForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit Claim' }));
    expect(await screen.findByText('Your name is required')).toBeInTheDocument();
    expect(screen.getByText('Please describe the issue')).toBeInTheDocument();
  });

  it('submits the claim and shows a confirmation', async () => {
    render(<ClaimForm />);
    await userEvent.type(screen.getByLabelText('What happened?'), 'Box arrived damaged');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Claim' }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        contactName: 'Jane Doe',
        email: 'jane@example.com',
        description: 'Box arrived damaged',
      })
    );
    expect(
      await screen.findByText(/your claim has been submitted/)
    ).toBeInTheDocument();
  });
});
