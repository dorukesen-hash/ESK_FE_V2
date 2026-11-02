import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVariant } from '@/hooks/useVariant';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { ProductView } from './ProductView';
import { StickyBuyBar } from './StickyBuyBar';

vi.mock('@/hooks/useVariant', () => ({
  useVariant: vi.fn(),
}));
vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));
vi.mock('./StickyBuyBar', () => ({
  StickyBuyBar: vi.fn(() => null),
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
  specs: [{ group: 'Material & Performance', specs: [{ label: 'Color', value: 'White' }] }],
  images: ['https://cdn.example.com/a.jpg'],
  nodeId: 18,
  categoryId: 9,
  subcategoryId: 18,
  productId: null,
};

const tree = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    children: [{ id: 18, name: 'Composite Strapping', children: [], variants: [] }],
  },
];

describe('ProductView', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
    useCatalogTree.mockReturnValue({ data: tree });
    StickyBuyBar.mockClear();
  });

  it('shows a not-found message when the variant does not resolve', () => {
    useVariant.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);
    expect(screen.getByText("We couldn't find that product.")).toBeInTheDocument();
  });

  it('renders title, SKU, price tiers, and a breadcrumb built from the catalog tree', () => {
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

  it('renders each spec group with its heading and rows', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    expect(screen.getByText('Material & Performance')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('White')).toBeInTheDocument();
  });

  it('renders the variant options table sourced from the resolved node, with a link to each row', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          children: [
            {
              id: 18,
              name: 'Composite Strapping',
              children: [],
              variants: [
                {
                  id: 327,
                  title: 'Composite Strapping',
                  sku: 'CC40/2',
                  one_four_units: '68.00',
                  pallet_pricing: '53.00',
                  units_per_pallet: 10,
                  color: 'White',
                },
              ],
            },
          ],
        },
      ],
    });
    render(<ProductView variantId="327" />);

    expect(screen.getByRole('heading', { name: 'Available Options' })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'Composite Strapping' })
        .some((link) => link.getAttribute('href') === '/product/composite-strapping/327')
    ).toBe(true);
  });

  it("uses the resolved node's displayFields for the Available Options table when set", () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          children: [
            {
              id: 18,
              name: 'Composite Strapping',
              children: [],
              displayFields: ['break_strength'],
              variants: [
                { id: 327, title: 'Composite Strapping', sku: 'CC40/2', break_strength: 750 },
                { id: 329, title: 'Other size', sku: 'CC50/2', break_strength: 750 },
              ],
            },
          ],
        },
      ],
    });
    render(<ProductView variantId="327" />);

    expect(screen.getAllByText('Break strength').length).toBeGreaterThan(0);
  });

  it('renders without a breadcrumb category link when the variant has no nodeId', () => {
    useVariant.mockReturnValue({
      data: { ...baseVariant, nodeId: null },
      isLoading: false,
      isError: false,
    });
    render(<ProductView variantId="327" />);
    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'CORD STRAPPING' })).not.toBeInTheDocument();
  });

  it('keeps the buy box sticky on desktop without making the whole grid sticky', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const buyBox = screen.getByTestId('product-buy-box');
    expect(buyBox).toHaveClass('helper-sticky-under-breadcrumbs', 'lg:self-start');

    const grid = buyBox.parentElement;
    expect(grid.className).not.toMatch(/sticky/);
  });

  it('keeps the image and the spec/description/bullets block together in the left column, not inside the sticky buy box', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const buyBox = screen.getByTestId('product-buy-box');
    const specHeading = screen.getByText('Material & Performance');
    const image = screen.getByRole('img', { name: 'Composite Strapping' });

    expect(buyBox.contains(specHeading)).toBe(false);
    expect(buyBox.contains(image)).toBe(false);

    const grid = buyBox.parentElement;
    const leftColumn = grid.firstElementChild;
    expect(leftColumn.contains(specHeading)).toBe(true);
    expect(leftColumn.contains(image)).toBe(true);
  });

  it('renders the spec groups above the description and the bullets', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const specHeading = screen.getByText('Material & Performance');
    const description = screen.getByText('A strap.');
    const bullet = screen.getByText('Strong');

    expect(
      specHeading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      specHeading.compareDocumentPosition(bullet) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('wires the mobile sticky bar to the first price tier, the real button, and the add-to-cart handler', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const props = StickyBuyBar.mock.calls[0][0];
    expect(props.priceLabel).toBe('$68.00');
    expect(typeof props.onAddToCart).toBe('function');
    expect(props.targetRef.current).toBe(screen.getByRole('button', { name: 'Add to Cart' }));
  });

  it('passes a null priceLabel to the sticky bar instead of crashing when a variant has no price tiers', () => {
    useVariant.mockReturnValue({
      data: { ...baseVariant, priceTiers: [] },
      isLoading: false,
      isError: false,
    });
    expect(() => render(<ProductView variantId="327" />)).not.toThrow();

    const props = StickyBuyBar.mock.calls[0][0];
    expect(props.priceLabel).toBeNull();
  });
});
