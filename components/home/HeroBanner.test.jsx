import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroBanner } from './HeroBanner';

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('HeroBanner', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the first slide as active', () => {
    render(<HeroBanner />);
    expect(
      screen.getByRole('heading', {
        name: 'Industrial packaging supplies for every business',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('jumps to a slide via its numbered tab', async () => {
    render(<HeroBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(
      screen.getByRole('heading', {
        name: 'Packaging solutions for demanding industrial loads',
      })
    ).toBeInTheDocument();
  });

  it('autoplays to the next slide after the interval', () => {
    vi.useFakeTimers();
    render(<HeroBanner />);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(
      screen.getByRole('heading', {
        name: 'Everything your warehouse needs, in one order',
      })
    ).toBeInTheDocument();
  });

  it('does not autoplay when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    vi.useFakeTimers();
    render(<HeroBanner />);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(
      screen.getByRole('heading', {
        name: 'Industrial packaging supplies for every business',
      })
    ).toBeInTheDocument();
  });
});
