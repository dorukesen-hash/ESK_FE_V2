import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCategoryDetail } from '@/hooks/useCategoryDetail';
import { CategoryView } from './CategoryView';

vi.mock('@/hooks/useCategoryDetail', () => ({
  useCategoryDetail: vi.fn(),
}));

describe('CategoryView', () => {
  it('shows a not-found message when the category does not resolve', () => {
    useCategoryDetail.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<CategoryView categorySlug="nonexistent" />);
    expect(screen.getByText("We couldn't find that category.")).toBeInTheDocument();
  });

  it('renders subcategory tiles linking under the category', () => {
    useCategoryDetail.mockReturnValue({
      data: {
        id: 9,
        name: 'CORD STRAPPING',
        subcategories: [
          {
            id: 18,
            name: 'Composite Strapping',
            slug: 'composite-strapping',
            image: 'https://cdn.example.com/a.jpg',
            productCount: 5,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<CategoryView categorySlug="cord-strapping" />);

    expect(screen.getByRole('heading', { name: 'CORD STRAPPING' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Composite Strapping/ })
    ).toHaveAttribute('href', '/category/cord-strapping/composite-strapping');
    expect(screen.getByText('5 products')).toBeInTheDocument();
  });
});
