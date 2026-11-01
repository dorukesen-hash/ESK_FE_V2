'use client';

import { useEffect, useState } from 'react';

// Mirrors the in-flow "Add to Cart" button on mobile once it scrolls out
// of view. Watches `targetRef` (that real button) via IntersectionObserver
// rather than a scroll-position threshold, so it tracks the button's
// actual on-screen state regardless of page length or viewport size, and
// never shows up while the real button is still reachable.
export function StickyBuyBar({ targetRef, priceLabel, onAddToCart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface px-4 py-3 shadow-card lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-text-primary">{priceLabel}</span>
        <button
          type="button"
          onClick={onAddToCart}
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
