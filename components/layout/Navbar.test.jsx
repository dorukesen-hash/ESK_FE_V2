import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { Navbar } from './Navbar';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

describe('Navbar', () => {
  it('renders About Us as a real link', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute(
      'href',
      '/about-us'
    );
  });

  it('renders Knowledge Center as a disabled, non-navigating item', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);

    const item = screen.getByText('Knowledge Center').closest('[aria-disabled="true"]');
    expect(item).toBeInTheDocument();
    expect(item.tagName).not.toBe('A');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders Industries We Serve as a real link to the homepage section', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'Industries We Serve' })
    ).toHaveAttribute('href', '/#industries');
  });

  // Opening the Radix mega menu waits for its portaled content. This is
  // fast in isolation (~1s) but the first such interaction in this file
  // can occasionally exceed even a generous timeout under the full
  // suite's worker-pool contention (confirmed: raising the timeout from
  // 5s to 15s to 25s each still left it flaking under contention, so a
  // bigger number isn't the fix). `retry` is the right tool for
  // contention-driven slowness, as opposed to a deterministic failure.
  it(
    'shows a loading state inside the mega menu',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));
      expect(await screen.findByText('Loading categories…')).toBeInTheDocument();
    }
  );

  it(
    'shows an error state inside the mega menu',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));
      expect(await screen.findByText('Categories unavailable.')).toBeInTheDocument();
    }
  );

  it(
    'renders each node with its children and a View All Products link',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [
              { id: 24, name: 'Corner Board', children: [] },
              { id: 25, name: 'Strapping Protectors', children: [] },
            ],
          },
          { id: 7, name: 'Stretch Wrap', children: [] },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));

      expect(
        await screen.findByRole('menuitem', { name: 'EDGE PROTECTION' })
      ).toHaveAttribute('href', '/category/edge-protection');
      expect(
        screen.getByRole('menuitem', { name: 'Corner Board' })
      ).toHaveAttribute('href', '/category/edge-protection/corner-board');
      expect(
        screen.getByRole('menuitem', { name: 'Strapping Protectors' })
      ).toHaveAttribute('href', '/category/edge-protection/strapping-protectors');
      expect(
        screen.getByRole('menuitem', { name: 'Stretch Wrap' })
      ).toHaveAttribute('href', '/category/stretch-wrap');
      expect(
        screen.getByRole('menuitem', { name: 'View All Products →' })
      ).toHaveAttribute('href', '/search');
    }
  );
});
