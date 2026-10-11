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

  it('only shows spec columns that at least one row has a value for', () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 2,
        level: 'product',
        levelName: 'Composite Strapping',
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', basePrice: 68, palletPrice: null, unitsPerPallet: null, specValues: specValues({ color: 'White' }) },
          { id: 328, title: 'Five Eighths', sku: 'CC50', basePrice: 70, palletPrice: null, unitsPerPallet: null, specValues: specValues({ size: '5/8"' }) },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    expect(screen.getByRole('columnheader', { name: 'Color' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Size' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Material' })).not.toBeInTheDocument();
    // Half Inch has no size value - shown as an em dash in that column.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('highlights the current variant row', () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 2,
        level: 'product',
        levelName: null,
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', basePrice: 68, palletPrice: null, unitsPerPallet: null, specValues: specValues() },
          { id: 328, title: 'Five Eighths', sku: 'CC50', basePrice: 70, palletPrice: null, unitsPerPallet: null, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    expect(screen.getByText('Half Inch').closest('tr')).toHaveClass('bg-accent-tint');
    expect(screen.getByText('Five Eighths').closest('tr')).not.toHaveClass('bg-accent-tint');
  });

  it('adds the row quantity to the cart and opens the drawer', async () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'product',
        levelName: null,
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', basePrice: 68, palletPrice: 53, unitsPerPallet: 10, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    const qty = screen.getByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

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
          { id: 327, title: 'Half Inch', sku: 'CC40', basePrice: 68, palletPrice: 53, unitsPerPallet: 10, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    const qty = screen.getByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '10');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(useCartStore.getState().items).toEqual([{ variantId: 327, quantity: 10, isPallet: true }]);
  });

  it('shows a Load all button only when more rows exist beyond the preview, and switches to the full fetch on click', async () => {
    useVariantSiblings.mockReturnValue({
      data: {
        count: 130,
        level: 'subcategory',
        levelName: 'Corrugated Boxes',
        rows: [
          { id: 327, title: 'Half Inch', sku: 'CC40', basePrice: 68, palletPrice: null, unitsPerPallet: null, specValues: specValues() },
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
          { id: 327, title: 'Half Inch', sku: 'CC40', basePrice: 68, palletPrice: null, unitsPerPallet: null, specValues: specValues() },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<VariantsTable variantId={327} />);

    expect(screen.queryByRole('button', { name: /Load all/ })).not.toBeInTheDocument();
  });
});
