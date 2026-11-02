import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useElementHeightVar } from './useElementHeightVar';

function Probe({ cssVarName, height }) {
  const setRef = useElementHeightVar(cssVarName);
  return (
    <div
      ref={(node) => {
        if (node) {
          Object.defineProperty(node, 'offsetHeight', { value: height, configurable: true });
        }
        return setRef(node);
      }}
    />
  );
}

describe('useElementHeightVar', () => {
  it("publishes the element's offsetHeight as the given CSS variable on mount", () => {
    render(<Probe cssVarName="--test-height" height={42} />);
    expect(document.documentElement.style.getPropertyValue('--test-height')).toBe('42px');
  });

  it('removes the CSS variable on unmount', () => {
    const { unmount } = render(<Probe cssVarName="--test-height-2" height={10} />);
    expect(document.documentElement.style.getPropertyValue('--test-height-2')).toBe('10px');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--test-height-2')).toBe('');
  });
});
