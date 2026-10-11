import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVariant } from '@/hooks/useVariant';
import { useCategories } from '@/hooks/useCategories';
import { useVariantSiblings } from '@/hooks/useVariantSiblings';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { ProductView } from './ProductView';

vi.mock('@/hooks/useVariant', () => ({
  useVariant: vi.fn(),
}));
vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));
vi.mock('@/hooks/useVariantSiblings', () => ({
  useVariantSiblings: vi.fn(),
}));

const baseVariant = {
  id: 327,
  title: 'Composite Strapping',
  sku: 'CC40/2',
  description: 'A strap.',
  unit: 'Coils',
  priceTiers: [
    { label: '1-4 units', price: 68 },
    { label: 'Full pallet', price: 53 },
  ],
  bullets: ['Strong'],
  specs: [{ label: 'Color', value: 'White' }],
  images: ['https://cdn.example.com/a.jpg'],
  categoryId: 9,
  subcategoryId: 18,
  productId: null,
};

describe('ProductView', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
    useCategories.mockReturnValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          subcategories: [{ id: 18, name: 'Composite Strapping' }],
        },
      ],
    });
    useVariantSiblings.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  });

  it('shows a not-found message when the variant does not resolve', () => {
    useVariant.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);
    expect(screen.getByText("We couldn't find that product.")).toBeInTheDocument();
  });

  it('renders title, SKU, price tiers, and a breadcrumb with category/subcategory names', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('$68.00')).toBeInTheDocument();
    expect(screen.getByText('$53.00')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'CORD STRAPPING' })
    ).toHaveAttribute('href', '/category/cord-strapping');
    expect(
      screen.getByRole('link', { name: 'Composite Strapping' })
    ).toHaveAttribute('href', '/category/cord-strapping/composite-strapping');
  });

  it('adds the chosen quantity to the cart and opens the cart drawer', async () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const quantityInput = screen.getByLabelText('Quantity');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 3, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('adds as a pallet line when the pallet checkbox is checked', async () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    await userEvent.click(screen.getByLabelText('Order by full pallet'));
    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 1, isPallet: true },
    ]);
  });

  it('renders the variant options table wired to the current variant id', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'subcategory',
        levelName: 'Composite Strapping',
        rows: [
          {
            id: 327,
            title: 'Composite Strapping',
            sku: 'CC40/2',
            priceTiers: [{ label: '1-4 units', price: 68 }],
            palletPrice: 53,
            unitsPerPallet: 10,
            specValues: { size: null, color: 'White', material_type: null, style: null, unit: null, quantity_case: null, units_per_pallet: null, break_strength: null, core_diameter: null },
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<ProductView variantId="327" />);

    expect(useVariantSiblings).toHaveBeenCalledWith(327, { all: false });
    expect(screen.getByRole('heading', { name: 'Available Options' })).toBeInTheDocument();
  });
});
