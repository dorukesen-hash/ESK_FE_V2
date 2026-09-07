import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders title, SKU, price and links to the product', () => {
    render(
      <ProductCard
        product={{
          title: 'Composite Strapping',
          sku: 'CC40/2',
          price: 68,
          unit: 'Coils',
          image: 'https://cdn.example.com/a.jpg',
          href: '/product/composite-strapping/327',
        }}
      />
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
    expect(screen.getByText('Composite Strapping')).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('$68.00 / Coils')).toBeInTheDocument();
  });

  it('omits SKU and price lines when absent', () => {
    render(
      <ProductCard
        product={{ title: 'No Data', sku: null, price: null, unit: null, image: null, href: '/x' }}
      />
    );
    expect(screen.queryByText(/SKU:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});
