import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ isCartDrawerOpen: false, isMobileNavOpen: false });
  });

  it('opens and closes the cart drawer', () => {
    useUIStore.getState().openCartDrawer();
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
    useUIStore.getState().closeCartDrawer();
    expect(useUIStore.getState().isCartDrawerOpen).toBe(false);
  });

  it('toggles and closes the mobile nav', () => {
    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(true);
    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);
    useUIStore.getState().toggleMobileNav();
    useUIStore.getState().closeMobileNav();
    expect(useUIStore.getState().isMobileNavOpen).toBe(false);
  });
});
