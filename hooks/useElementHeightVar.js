'use client';

import { useCallback } from 'react';

// Measures an element's real rendered height and publishes it as a CSS
// custom property on the document root, kept in sync via ResizeObserver.
// Anything elsewhere on the page that needs to sit below this element -
// a sticky bar further down, a sidebar that must never grow past its
// sibling - reads the variable instead of a guessed fixed pixel value
// that drifts out of sync the moment this element's own content changes
// size.
//
// Returns a callback ref, not a ref object + useLayoutEffect: a
// component that renders a loading-skeleton branch first and the real,
// ref'd element only once data arrives never attaches anything to a ref
// object during that first render, and a layout effect keyed on this
// hook's own stable arguments only runs on that first (empty) render -
// it has no way to know the real element showed up two renders later. A
// callback ref doesn't have that problem: React invokes it exactly when
// this specific element attaches or detaches, no matter which render
// that happens on. The cleanup function it returns is a React 19
// ref-callback feature - React calls it on detach/unmount, same
// contract as a useEffect cleanup.
export function useElementHeightVar(cssVarName) {
  return useCallback(
    (element) => {
      if (!element) return undefined;

      function applyHeight() {
        document.documentElement.style.setProperty(cssVarName, `${element.offsetHeight}px`);
      }

      applyHeight();

      if (typeof ResizeObserver === 'undefined') return undefined;
      const observer = new ResizeObserver(applyHeight);
      observer.observe(element);

      return () => {
        observer.disconnect();
        document.documentElement.style.removeProperty(cssVarName);
      };
    },
    [cssVarName]
  );
}
