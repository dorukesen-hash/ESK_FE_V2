import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSubcategoryProducts } from '@/hooks/useSubcategoryProducts';
import { SubcategoryView } from './SubcategoryView';

vi.mock('@/hooks/useSubcategoryProducts', () => ({
  useSubcategoryProducts: vi.fn(),
}));

describe('SubcategoryView', () => {
  it('shows a not-found message when the subcategory does not resolve', () => {
    useSubcategoryProducts.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<SubcategoryView categorySlug="cord-strapping" subcategorySlug="nonexistent" />);
    expect(screen.getByText("We couldn't find that subcategory.")).toBeInTheDocument();
  });

  it('renders a breadcrumb and a product card per listed variant', () => {
    useSubcategoryProducts.mockReturnValue({
      data: {
        categoryId: 9,
        categoryName: 'CORD STRAPPING',
        id: 18,
        name: 'Composite Strapping',
        products: [
          {
            id: 327,
            title: 'A',
            sku: 'CC40/2',
            price: 68,
            unit: 'Coils',
            image: null,
            href: '/product/composite-strapping/327',
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<SubcategoryView categorySlug="cord-strapping" subcategorySlug="composite-strapping" />);

    expect(
      screen.getByRole('link', { name: 'CORD STRAPPING' })
    ).toHaveAttribute('href', '/category/cord-strapping');
    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^A/ })).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
  });
});
