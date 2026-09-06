import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryShowcase } from './CategoryShowcase';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

function makeCategories(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Category ${i + 1}`,
    image: null,
    subcategories: [],
  }));
}

function tileFor(categoryName) {
  return screen.getByRole('link', { name: new RegExp(categoryName) });
}

describe('CategoryShowcase', () => {
  it('renders an empty state when there are no categories', () => {
    useCategories.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(screen.getByText('No categories available yet.')).toBeInTheDocument();
  });

  it('never spans the feature tile when there are too few categories to fill its rows', () => {
    useCategories.mockReturnValue({
      data: makeCategories(4),
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);
    expect(tileFor('Category 1').className).not.toContain('row-span-2');
  });

  it('spans the feature tile once there are enough categories to fill its rows', () => {
    useCategories.mockReturnValue({
      data: makeCategories(5),
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);
    expect(tileFor('Category 1').className).toContain('row-span-2');
  });

  it('does not span the sixth tile wide unless two more categories follow it', () => {
    useCategories.mockReturnValue({
      data: makeCategories(7),
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);
    expect(tileFor('Category 6').className).not.toContain('col-span-2');
  });

  it('spans the sixth tile wide once the grid is fully packed', () => {
    useCategories.mockReturnValue({
      data: makeCategories(8),
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);
    expect(tileFor('Category 6').className).toContain('col-span-2');
  });

  it('renders skeleton placeholders while loading', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<CategoryShowcase />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);
  });

  it('shows an error message when the request fails', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<CategoryShowcase />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders a card per category linking to its slug', () => {
    useCategories.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', image: 'https://cdn.example.com/a.jpg', subcategories: [] },
        { id: 7, name: 'Boxes', image: null, subcategories: [] },
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
    useCategories.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', image: null, subcategories: [] },
        { id: 7, name: 'Boxes', image: null, subcategories: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });
});
