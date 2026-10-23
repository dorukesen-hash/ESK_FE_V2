import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { VariantsTable } from './VariantsTable';

// toTableRow (inside VariantsTable.js) expects RAW variant columns - the
// same shape node.variants / GET /variant/:id return - not the pre-shaped
// row objects the old (deleted) useVariantSiblings hook used to produce.
function rawVariant(overrides = {}) {
  return {
    id: 327,
    title: 'Half Inch',
    sku: 'CC40',
    one_four_units: null,
    five_nine_units: null,
    ten_plus_units: null,
    pallet_pricing: null,
    units_per_pallet: null,
    size: null,
    color: null,
    material_type: null,
    style: null,
    unit: null,
    quantity_case: null,
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

  it('renders nothing when there are no variants', () => {
    const { container } = render(
      <VariantsTable variants={[]} productSlug="composite-strapping" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('only shows spec columns whose value differs somewhere in the set, not ones every row shares', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({ id: 327, title: 'Half Inch', color: 'White', style: 'Standard Duty' }),
          rawVariant({ id: 328, title: 'Five Eighths', color: 'White', style: 'Heavy Duty' }),
        ]}
      />
    );

    expect(screen.getAllByText('Style').length).toBeGreaterThan(0);
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
  });

  it('highlights the current variant row', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        currentVariantId={327}
        variants={[
          rawVariant({ id: 327, title: 'Half Inch' }),
          rawVariant({ id: 328, title: 'Five Eighths' }),
        ]}
      />
    );

    const [currentDesktop] = screen.getAllByText('Half Inch');
    const [otherDesktop] = screen.getAllByText('Five Eighths');
    expect(currentDesktop.closest('div.border-b')).toHaveClass('bg-accent-tint');
    expect(otherDesktop.closest('div.border-b')).not.toHaveClass('bg-accent-tint');
  });

  it('shows all 3 quantity-tier prices per row', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({
            id: 327,
            title: 'Half Inch',
            one_four_units: '12.00',
            five_nine_units: '11.00',
            ten_plus_units: '10.00',
          }),
        ]}
      />
    );

    expect(screen.getAllByText('1-4 units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-9 units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$11.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10+ units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
  });

  it('adds the row quantity to the cart and opens the drawer', async () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({
            id: 327,
            title: 'Half Inch',
            one_four_units: '68.00',
            pallet_pricing: '53.00',
            units_per_pallet: 10,
          }),
        ]}
      />
    );

    const [qty] = screen.getAllByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '3');
    const [desktopAdd] = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(desktopAdd);

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 3, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('auto-detects a pallet order once quantity reaches the pallet threshold', async () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[
          rawVariant({
            id: 327,
            title: 'Half Inch',
            one_four_units: '68.00',
            pallet_pricing: '53.00',
            units_per_pallet: 10,
          }),
        ]}
      />
    );

    const [qty] = screen.getAllByLabelText('Quantity for Half Inch');
    await userEvent.clear(qty);
    await userEvent.type(qty, '10');
    const [desktopAdd] = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(desktopAdd);

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 10, isPallet: true },
    ]);
  });

  it('shows a Show all button only when more rows exist beyond the preview, and reveals them locally with no refetch', async () => {
    const variants = Array.from({ length: 25 }, (_, i) =>
      rawVariant({ id: i + 1, title: `Variant ${i + 1}` })
    );
    render(<VariantsTable productSlug="composite-strapping" variants={variants} />);

    expect(screen.queryByText('Variant 25')).not.toBeInTheDocument();
    const showAll = screen.getByRole('button', { name: 'Show all 25' });
    await userEvent.click(showAll);

    expect(screen.getAllByText('Variant 25').length).toBeGreaterThan(0);
  });

  it('hides the Show all button once every row already fits in the preview', () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[rawVariant({ id: 327, title: 'Half Inch' })]}
      />
    );
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });

  it("links each row's title to its product page, built from productSlug and the row's own id", () => {
    render(
      <VariantsTable
        productSlug="composite-strapping"
        variants={[rawVariant({ id: 327, title: 'Half Inch' })]}
      />
    );

    const [link] = screen.getAllByRole('link', { name: 'Half Inch' });
    expect(link).toHaveAttribute('href', '/product/composite-strapping/327');
  });
});
