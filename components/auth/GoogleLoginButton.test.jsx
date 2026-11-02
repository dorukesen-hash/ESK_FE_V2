import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

  it('remembers google as the last method on click, keeping any remembered email', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    const { GoogleLoginButton } = await import('./GoogleLoginButton');
    // Imported dynamically, same as GoogleLoginButton itself - this file's
    // afterEach calls vi.resetModules() after every test (needed so each
    // env-var branch gets a fresh module), which means a statically
    // top-of-file-imported useLoginMemoryStore would resolve to a DIFFERENT
    // store instance than the one this freshly re-imported GoogleLoginButton
    // actually reads/writes. Importing it here, in the same dynamic-import
    // graph, is what makes the assertion observe the same store the click
    // handler updates.
    const { useLoginMemoryStore } = await import('@/stores/loginMemoryStore');
    useLoginMemoryStore.setState({ lastEmail: 'jane@example.com', lastMethod: null });
    render(<GoogleLoginButton />);

    // fireEvent.click (not userEvent.click) deliberately - a real click on an
    // <a href> makes jsdom attempt navigation, which it doesn't implement and
    // logs as an error (cosmetic, already seen elsewhere in this suite's
    // output) for no benefit here; fireEvent still dispatches the click event
    // React's onClick handler listens for, without jsdom trying to follow the
    // link.
    fireEvent.click(screen.getByRole('link', { name: /Continue with Google/ }));

    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'jane@example.com',
      lastMethod: 'google',
    });
  });
});
