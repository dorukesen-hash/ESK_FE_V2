import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVariantSiblings } from '@/hooks/useVariantSiblings';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { VariantsTable } from './VariantsTable';

vi.mock('@/hooks/useVariantSiblings', () => ({
  useVariantSiblings: vi.fn(),
}));

function specValues(overrides = {}) {
  return {
    size: null,
    color: null,
    material_type: null,
    style: null,
    unit: null,
    quantity_case: null,
    units_per_pallet: null,
    break_strength: null,
    core_diameter: null,
    ...overrides,
  };
}

// The component renders a desktop grid row AND a mobile card for every
// row (CSS, not JS, decides which is visible), so most text/controls
// exist twice in the DOM - tests interact with the desktop ("Qty for X",
// not "Qty for X mobile") instance explicitly.
describe('VariantsTable', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
  });

  it('renders nothing while loading, on error, or with no rows', () => {
    useVariantSiblings.mockReturnValueOnce({ data: undefined, isLoading: true, isError: false });
    const { container, rerender } = render(<VariantsTable variantId={327} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    useVariantSiblings.mockReturnValueOnce({ data: undefined, isLoading: false, isError: true });
    rerender(<VariantsTable variantId={327} />);
    expect(screen.queryByRole('heading', { name: 'Available Options' })).not.toBeInTheDocument();

    useVariantSiblings.mockReturnValueOnce({
      data: { count: 0, level: 'variant', levelName: null, rows: [] },
      isLoading: false,
      isError: false,
    });
    rerender(<VariantsTable variantId={327} />);
    expect(screen.queryByRole('heading', { name: 'Available Options' })).not.toBeInTheDocument();
  });

  it('only shows spec columns whose value differs somewhere in the set, not ones every row shares', () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 2,
        level: 'product',
        levelName: 'Composite Strapping',
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', priceTiers: [], palletPrice: null, unitsPerPallet: null, specValues: specValues({ color: 'White', style: 'Standard Duty' }) },
          { id: 328, title: 'Five Eighths', sku: 'CC50', priceTiers: [], palletPrice: null, unitsPerPallet: null, specValues: specValues({ color: 'White', style: 'Heavy Duty' }) },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    // Style differs between rows (Standard vs Heavy Duty) - shown.
    expect(screen.getAllByText('Style').length).toBeGreaterThan(0);
    // Color is "White" on every row - not a useful column, hidden.
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
  });

  it('highlights the current variant row', () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 2,
        level: 'product',
        levelName: null,
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', priceTiers: [], palletPrice: null, unitsPerPallet: null, specValues: specValues() },
          { id: 328, title: 'Five Eighths', sku: 'CC50', priceTiers: [], palletPrice: null, unitsPerPallet: null, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    const [currentDesktop] = screen.getAllByText('Half Inch');
    const [otherDesktop] = screen.getAllByText('Five Eighths');
    // The row wrapper (two levels up from the title) carries the highlight.
    expect(currentDesktop.closest('div.border-b')).toHaveClass('bg-accent-tint');
    expect(otherDesktop.closest('div.border-b')).not.toHaveClass('bg-accent-tint');
  });

  it('shows all 3 quantity-tier prices per row', () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'product',
        levelName: null,
        rows: [
          {
            id: 327,
            title: 'Half Inch',
            sku: 'CC40',
            priceTiers: [
              { label: '1-4 units', price: 12 },
              { label: '5-9 units', price: 11 },
              { label: '10+ units', price: 10 },
            ],
            palletPrice: null,
            unitsPerPallet: null,
            specValues: specValues(),
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    expect(screen.getAllByText('1-4 units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-9 units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$11.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10+ units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
  });

  it('adds the row quantity to the cart and opens the drawer', async () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'product',
        levelName: null,
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', priceTiers: [{ label: '1-4 units', price: 68 }], palletPrice: 53, unitsPerPallet: 10, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    const [qty] = screen.getAllByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    const [desktopAdd] = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(desktopAdd);

    expect(useCartStore.getState().items).toEqual([{ variantId: 327, quantity: 3, isPallet: false }]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('auto-detects a pallet order once quantity reaches the pallet threshold', async () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'product',
        levelName: null,
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', priceTiers: [{ label: '1-4 units', price: 68 }], palletPrice: 53, unitsPerPallet: 10, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    const [qty] = screen.getAllByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '10');
    const [desktopAdd] = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(desktopAdd);

    expect(useCartStore.getState().items).toEqual([{ variantId: 327, quantity: 10, isPallet: true }]);
  });

  it('shows a Load all button only when more rows exist beyond the preview, and switches to the full fetch on click', async () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 130,
        level: 'subcategory',
        levelName: 'Corrugated Boxes',
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', priceTiers: [], palletPrice: null, unitsPerPallet: null, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    const loadAll = screen.getByRole('button', { name: 'Load all 130 in Corrugated Boxes' });
    await userEvent.click(loadAll);

    expect(useVariantSiblings).toHaveBeenLastCalledWith(327, { all: true });
  });

  it('hides the Load all button once every row is already loaded', () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'product',
        levelName: null,
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', priceTiers: [], palletPrice: null, unitsPerPallet: null, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    expect(screen.queryByRole('button', { name: /Load all/ })).not.toBeInTheDocument();
  });
});
