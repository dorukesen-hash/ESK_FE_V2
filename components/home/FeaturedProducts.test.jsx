import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';
import { FeaturedProducts } from './FeaturedProducts';

vi.mock('@/hooks/useFeaturedProducts', () => ({
  useFeaturedProducts: vi.fn(),
}));

describe('FeaturedProducts', () => {
  it('renders nothing when there are no featured products', () => {
    useFeaturedProducts.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { container } = render(<FeaturedProducts />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading placeholders while fetching', () => {
    useFeaturedProducts.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<FeaturedProducts />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);
  });

  it('shows an error message when the request fails', () => {
    useFeaturedProducts.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<FeaturedProducts />);
    expect(screen.getByText('Featured products unavailable.')).toBeInTheDocument();
  });

  it('renders a card per featured product with price and link', () => {
    useFeaturedProducts.mockReturnValue({
      data: [
        {
          id: 327,
          title: '1/2" x 3610\' Composite Cord Strapping',
          price: 68,
          unit: 'Coils',
          image: 'https://cdn.example.com/a.jpg',
          href: '/product/composite-strapping/327',
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<FeaturedProducts />);

    const link = screen.getByRole('link', {
      name: /Composite Cord Strapping/,
    });
    expect(link).toHaveAttribute('href', '/product/composite-strapping/327');
    expect(screen.getByText('$68.00 / Coils')).toBeInTheDocument();
  });
});
