import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryShowcase } from './CategoryShowcase';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

describe('CategoryShowcase', () => {
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
