import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// GoogleLoginButton reads NEXT_PUBLIC_API_URL at module-load time (same
// pattern as PaymentSection's Stripe key), so each branch needs its own
// fresh module import under vi.stubEnv rather than a single static import.
describe('GoogleLoginButton', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('links straight to the backend OAuth entry point when configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    const { GoogleLoginButton } = await import('./GoogleLoginButton');
    render(<GoogleLoginButton />);
    expect(screen.getByRole('link', { name: /Continue with Google/ })).toHaveAttribute(
      'href',
      'https://api.example.com/auth/google'
    );
  });

  it('renders nothing when the API URL is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    const { GoogleLoginButton } = await import('./GoogleLoginButton');
    const { container } = render(<GoogleLoginButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
