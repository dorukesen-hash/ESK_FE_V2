import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StickyBuyBar } from './StickyBuyBar';

let observerCallback;
let disconnectSpy;
let observeSpy;

beforeEach(() => {
  disconnectSpy = vi.fn();
  observeSpy = vi.fn();
  global.IntersectionObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }
    observe = observeSpy;
    disconnect = disconnectSpy;
  };
});

afterEach(() => {
  delete global.IntersectionObserver;
});

function renderWithTarget(overrides = {}) {
  const targetRef = { current: document.createElement('button') };
  const onAddToCart = vi.fn();
  const utils = render(
    <StickyBuyBar
      targetRef={targetRef}
      priceLabel="$68.00"
      onAddToCart={onAddToCart}
      {...overrides}
    />
  );
  return { ...utils, onAddToCart, targetRef };
}

describe('StickyBuyBar', () => {
  it('renders nothing while the real Add to Cart button is still on-screen', () => {
    renderWithTarget();
    act(() => observerCallback([{ isIntersecting: true }]));
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument();
  });

  it('becomes visible once the real button scrolls out of view', () => {
    renderWithTarget();
    act(() => observerCallback([{ isIntersecting: false }]));
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
    expect(screen.getByText('$68.00')).toBeInTheDocument();
  });

  it('calls onAddToCart when clicked, with no quantity control of its own', async () => {
    const { onAddToCart } = renderWithTarget();
    act(() => observerCallback([{ isIntersecting: false }]));

    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('does not throw and observes nothing when targetRef has no current element', () => {
    const targetRef = { current: null };
    expect(() =>
      render(<StickyBuyBar targetRef={targetRef} priceLabel="$68.00" onAddToCart={vi.fn()} />)
    ).not.toThrow();
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('disconnects its observer on unmount', () => {
    const { unmount } = renderWithTarget();
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
