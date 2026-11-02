import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChromeStack } from './ChromeStack';

vi.mock('./Header', () => ({ Header: () => <div data-testid="header-stub" /> }));
vi.mock('./Navbar', () => ({ Navbar: () => <div data-testid="navbar-stub" /> }));

describe('ChromeStack', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--chrome-height');
  });

  it('renders Header and Navbar together inside one sticky wrapper', () => {
    const { container } = render(<ChromeStack />);
    const wrapper = container.firstChild;

    expect(wrapper).toHaveClass('sticky', 'top-0', 'z-20');
    expect(wrapper.querySelector('[data-testid="header-stub"]')).toBeInTheDocument();
    expect(wrapper.querySelector('[data-testid="navbar-stub"]')).toBeInTheDocument();
  });

  it('publishes its own rendered height as the --chrome-height CSS variable', () => {
    render(<ChromeStack />);
    expect(document.documentElement.style.getPropertyValue('--chrome-height')).toBe('0px');
  });

  it('clears --chrome-height once unmounted', () => {
    const { unmount } = render(<ChromeStack />);
    unmount();
    expect(document.documentElement.style.getPropertyValue('--chrome-height')).toBe('');
  });
});
