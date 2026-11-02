import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { Navbar } from './Navbar';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

describe('Navbar', () => {
  it('renders About Us as a real link', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute(
      'href',
      '/about-us'
    );
  });

  it('renders Knowledge Center as a disabled, non-navigating item', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);

    const item = screen.getByText('Knowledge Center').closest('[aria-disabled="true"]');
    expect(item).toBeInTheDocument();
    expect(item.tagName).not.toBe('A');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders Industries We Serve as a real link to its own page', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'Industries We Serve' })
    ).toHaveAttribute('href', '/industries');
  });

  it('renders View All Products as a real link to /search, not just a menu trigger', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'View All Products →' })
    ).toHaveAttribute('href', '/search');
  });

  it('shows a loading state in the bar while categories load', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows an error state in the bar when categories fail to load', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Navbar />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('does not show the mega menu panel before it is hovered', () => {
    useCatalogTree.mockReturnValue({
      data: [{ id: 12, name: 'EDGE PROTECTION', children: [] }],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);
    expect(screen.queryByText('EDGE PROTECTION')).not.toBeInTheDocument();
  });

  it('opens the mega menu on hover, listing every top-level category and its children', () => {
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 12,
          name: 'EDGE PROTECTION',
          children: [{ id: 24, name: 'Corner Board', children: [] }],
        },
        { id: 7, name: 'Stretch Wrap', children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'View All Products →' }));

    expect(screen.getByRole('link', { name: 'EDGE PROTECTION' })).toHaveAttribute(
      'href',
      '/category/edge-protection'
    );
    expect(screen.getByRole('link', { name: 'Corner Board' })).toHaveAttribute(
      'href',
      '/category/edge-protection/corner-board'
    );
    expect(screen.getByRole('link', { name: 'Stretch Wrap' })).toHaveAttribute(
      'href',
      '/category/stretch-wrap'
    );
  });

  it('renders a grandchild (3rd level) with the full canonical path inside the mega menu', () => {
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 12,
          name: 'EDGE PROTECTION',
          children: [
            {
              id: 24,
              name: 'Corner Board',
              children: [{ id: 99, name: 'White Corner Board', children: [] }],
            },
          ],
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'View All Products →' }));

    expect(
      screen.getByRole('link', { name: 'White Corner Board' })
    ).toHaveAttribute('href', '/category/edge-protection/corner-board/white-corner-board');
  });

  it('closes the mega menu once a category link inside it is clicked', () => {
    useCatalogTree.mockReturnValue({
      data: [{ id: 12, name: 'EDGE PROTECTION', children: [] }],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'View All Products →' }));
    fireEvent.click(screen.getByRole('link', { name: 'EDGE PROTECTION' }));

    expect(screen.queryByText('EDGE PROTECTION')).not.toBeInTheDocument();
  });

  describe('closing on mouseleave', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('closes after a short grace period once the pointer leaves the trigger', () => {
      useCatalogTree.mockReturnValue({
        data: [{ id: 12, name: 'EDGE PROTECTION', children: [] }],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      const trigger = screen.getByRole('link', { name: 'View All Products →' });
      fireEvent.mouseEnter(trigger);
      expect(screen.getByText('EDGE PROTECTION')).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);
      expect(screen.getByText('EDGE PROTECTION')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByText('EDGE PROTECTION')).not.toBeInTheDocument();
    });

    it('stays open if the pointer re-enters the trigger before the grace period elapses', () => {
      useCatalogTree.mockReturnValue({
        data: [{ id: 12, name: 'EDGE PROTECTION', children: [] }],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      const trigger = screen.getByRole('link', { name: 'View All Products →' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(trigger);

      vi.advanceTimersByTime(200);
      expect(screen.getByText('EDGE PROTECTION')).toBeInTheDocument();
    });

    it('stays open while the pointer is over the panel itself', () => {
      useCatalogTree.mockReturnValue({
        data: [{ id: 12, name: 'EDGE PROTECTION', children: [] }],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      const trigger = screen.getByRole('link', { name: 'View All Products →' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(screen.getByText('EDGE PROTECTION'));

      vi.advanceTimersByTime(200);
      expect(screen.getByText('EDGE PROTECTION')).toBeInTheDocument();
    });
  });
});
