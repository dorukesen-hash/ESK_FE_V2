'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { SPEC_FIELDS, formatSpecValue, extractPriceTiers } from '@/lib/variantFields';
import { Button } from '@/components/ui/Button';
import { QuantityInput } from './QuantityInput';

const PREVIEW_LIMIT = 20;

function toTableRow(variant) {
  const specValues = {};
  for (const field of SPEC_FIELDS) {
    specValues[field.key] = formatSpecValue(variant, field);
  }

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    priceTiers: extractPriceTiers(variant).filter((tier) => tier.label !== 'Full pallet'),
    palletPrice: variant.pallet_pricing != null ? Number(variant.pallet_pricing) : null,
    unitsPerPallet: variant.units_per_pallet != null ? Number(variant.units_per_pallet) : null,
    specValues,
  };
}

// Only columns where the value actually differs somewhere in this set of
// rows are worth a column - if every variant shares the same Material, a
// Material column is 20+ identical cells of noise, not a comparison aid.
function discriminatingFields(rows) {
  return SPEC_FIELDS.filter((field) => {
    const values = new Set(rows.map((row) => row.specValues[field.key] ?? null));
    return values.size > 1;
  });
}

function PriceTiers({ tiers }) {
  if (tiers.length === 0) return <span className="text-sm text-text-muted">—</span>;
  return (
    <div className="space-y-0.5">
      {tiers.map((tier) => (
        <div key={tier.label} className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-text-muted">{tier.label}</span>
          <span className="font-semibold text-text-primary">${tier.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// Renders as one CSS grid row on sm+ (columns fit the container width and
// shrink/truncate instead of forcing a wider box) and as a stacked card
// below sm, so there's never a horizontally-scrolling table on mobile.
function VariantRow({ row, href, isCurrent, visibleFields, gridTemplateColumns }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  function handleAdd() {
    // No pallet checkbox here - if the chosen quantity reaches the
    // variant's own pallet threshold, treat it as a pallet order
    // automatically, same price outcome as the manual checkbox on the
    // product page's own buy box.
    const isPallet = Boolean(
      row.palletPrice != null && row.unitsPerPallet != null && quantity >= row.unitsPerPallet
    );
    addItem(row.id, quantity, isPallet);
    openCartDrawer();
  }

  const qtyFieldId = `variants-table-qty-${row.id}`;
  const rowClass = isCurrent ? 'bg-accent-tint' : '';

  return (
    <div className={`border-b border-border py-3 last:border-b-0 sm:py-2 ${rowClass}`}>
      {/* Desktop/tablet: one grid row */}
      <div className="hidden items-center gap-3 px-3 sm:grid" style={{ gridTemplateColumns }}>
        <div className="min-w-0">
          <Link
            href={href}
            className="truncate text-sm font-medium text-text-primary hover:text-primary"
          >
            {row.title}
          </Link>
          {row.sku && <p className="truncate text-xs text-text-muted">SKU: {row.sku}</p>}
        </div>
        {visibleFields.map((field) => (
          <p key={field.key} className="truncate text-sm text-text-muted">
            {row.specValues[field.key] ?? '—'}
          </p>
        ))}
        <PriceTiers tiers={row.priceTiers} />
        <div>
          <label htmlFor={qtyFieldId} className="sr-only">
            Quantity for {row.title}
          </label>
          <QuantityInput
            id={qtyFieldId}
            value={quantity}
            onChange={setQuantity}
            className="h-9 w-full max-w-20 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleAdd}>
          Add
        </Button>
      </div>

      {/* Mobile: stacked card */}
      <div className="rounded-lg px-3 sm:hidden">
        <Link href={href} className="text-sm font-medium text-text-primary hover:text-primary">
          {row.title}
        </Link>
        {row.sku && <p className="text-xs text-text-muted">SKU: {row.sku}</p>}

        {visibleFields.length > 0 && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {visibleFields.map((field) => (
              <div key={field.key} className="flex justify-between gap-2 text-xs">
                <dt className="text-text-muted">{field.label}</dt>
                <dd className="text-text-primary">{row.specValues[field.key] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-3">
          <PriceTiers tiers={row.priceTiers} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={`${qtyFieldId}-mobile`} className="sr-only">
            Quantity for {row.title}
          </label>
          <QuantityInput
            id={`${qtyFieldId}-mobile`}
            value={quantity}
            onChange={setQuantity}
            className="h-10 w-20 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" variant="outline" className="flex-1" onClick={handleAdd}>
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VariantsTable({ variants, currentVariantId, productSlug }) {
  const [showAll, setShowAll] = useState(false);

  if (!variants || variants.length === 0) return null;

  const rows = variants.map(toTableRow);
  const visibleFields = discriminatingFields(rows);
  const hasMore = !showAll && rows.length > PREVIEW_LIMIT;
  const visibleRows = showAll ? rows : rows.slice(0, PREVIEW_LIMIT);
  const gridTemplateColumns = `minmax(0,1.6fr) ${visibleFields
    .map(() => 'minmax(0,1fr)')
    .join(' ')} 150px 88px 84px`;

  return (
    <div className="rounded-lg border border-border">
      <div
        className="hidden items-center gap-3 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted sm:grid"
        style={{ gridTemplateColumns }}
      >
        <span>Variant</span>
        {visibleFields.map((field) => (
          <span key={field.key}>{field.label}</span>
        ))}
        <span>Price</span>
        <span>Qty</span>
        <span />
      </div>

      <div className="px-0">
        {visibleRows.map((row) => (
          <VariantRow
            key={row.id}
            row={row}
            href={`/product/${productSlug}/${row.id}`}
            isCurrent={row.id === currentVariantId}
            visibleFields={visibleFields}
            gridTemplateColumns={gridTemplateColumns}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center border-t border-border p-4">
          <Button type="button" variant="outline" onClick={() => setShowAll(true)}>
            Show all {rows.length}
          </Button>
        </div>
      )}
    </div>
  );
}
