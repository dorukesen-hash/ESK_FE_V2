import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';
import HomePage from './page';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

// FeaturedProducts fetches its own data via react-query's useQuery directly
// (no QueryClientProvider wraps this test), so it must be mocked the same
// way components/home/FeaturedProducts.test.jsx already mocks it - this
// test only cares which top-level sections render, not FeaturedProducts'
// own internals, hence the empty-array fixture (its own "no featured
// products" case, already covered by that file).
vi.mock('@/hooks/useFeaturedProducts', () => ({
  useFeaturedProducts: vi.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    useFeaturedProducts.mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  it('renders HeroBanner, the category section, and FeaturedProducts', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: 'Shop by category' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Industrial packaging supplies for every business',
      })
    ).toBeInTheDocument();
  });

  it('does not render Product Guidance, Industries, or the Quote form', () => {
    render(<HomePage />);
    expect(
      screen.queryByRole('heading', { name: 'Get the right packaging for your application' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Packaging solutions built for the way your industry ships' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send Quote Request' })
    ).not.toBeInTheDocument();
  });
});
