import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { CategoryShowcase } from './CategoryShowcase';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

function makeNodes(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Category ${i + 1}`,
    images: [],
    children: [],
  }));
}

function tileFor(categoryName) {
  return screen.getByRole('link', { name: new RegExp(categoryName) });
}

describe('CategoryShowcase', () => {
  it('renders an empty state when there are no categories', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(screen.getByText('No categories available yet.')).toBeInTheDocument();
  });

  it('never spans the feature tile when there are too few categories to fill its rows', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(4), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 1').className).not.toContain('row-span-2');
  });

  it('spans the feature tile once there are enough categories to fill its rows', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(5), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 1').className).toContain('row-span-2');
  });

  it('does not span the sixth tile wide unless two more categories follow it', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(7), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 6').className).not.toContain('col-span-2');
  });

  it('spans the sixth tile wide once the grid is fully packed', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(8), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 6').className).toContain('col-span-2');
  });

  it('renders skeleton placeholders while loading', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<CategoryShowcase />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);
  });

  it('shows an error message when the request fails', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<CategoryShowcase />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders a card per category linking to its canonical path', () => {
    useCatalogTree.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', images: [{ image: { url: 'images/a.jpg' } }], children: [] },
        { id: 7, name: 'Boxes', images: [], children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);

    expect(screen.getByRole('link', { name: /EDGE PROTECTION/ })).toHaveAttribute(
      'href',
      '/category/edge-protection'
    );
    expect(screen.getByRole('link', { name: /Boxes/ })).toHaveAttribute(
      'href',
      '/category/boxes'
    );
  });

  it('numbers each tile starting from 01', () => {
    useCatalogTree.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', images: [], children: [] },
        { id: 7, name: 'Boxes', images: [], children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });
});
