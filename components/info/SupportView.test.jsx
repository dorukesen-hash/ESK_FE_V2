import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useCreateClaim } from '@/hooks/useCreateClaim';
import { SupportView } from './SupportView';

vi.mock('@/hooks/useCreateClaim', () => ({
  useCreateClaim: vi.fn(),
}));

describe('SupportView', () => {
  beforeEach(() => {
    useUIStore.setState({ isLoginModalOpen: false });
    useCreateClaim.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('prompts a signed-out visitor to log in instead of showing the claim form', async () => {
    useAuthStore.setState({ user: null, isLoading: false });
    render(<SupportView />);

    expect(screen.getByText(/Please log in to submit a claim/)).toBeInTheDocument();
    expect(screen.queryByLabelText('What happened?')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(useUIStore.getState().isLoginModalOpen).toBe(true);
  });

  it('shows the claim form for a signed-in user', () => {
    useAuthStore.setState({ user: { id: 1, name: 'Jane' }, isLoading: false });
    render(<SupportView />);
    expect(screen.getByLabelText('What happened?')).toBeInTheDocument();
  });
});
