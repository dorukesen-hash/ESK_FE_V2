'use client';

import { useState } from 'react';
import { useVariantSiblings } from '@/hooks/useVariantSiblings';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { SPEC_FIELDS } from '@/lib/variantFields';
import { Button } from '@/components/ui/Button';
import { QuantityInput } from './QuantityInput';

function VariantRow({ row, isCurrent, visibleFields }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  function handleAdd() {
    // No pallet checkbox here - if the chosen quantity reaches the
    // variant's own pallet threshold, treat it as a pallet order
    // automatically, same price outcome as the manual checkbox above.
    const isPallet = Boolean(
      row.palletPrice != null && row.unitsPerPallet != null && quantity >= row.unitsPerPallet
    );
    addItem(row.id, quantity, isPallet);
    openCartDrawer();
  }

  return (
    <tr className={`border-b border-border ${isCurrent ? 'bg-accent-tint' : ''}`}>
      <td className="whitespace-nowrap py-3 pr-4">
        <p className="text-sm font-medium text-text-primary">{row.title}</p>
        {row.sku && <p className="text-xs text-text-muted">SKU: {row.sku}</p>}
      </td>
      {visibleFields.map((field) => (
        <td key={field.key} className="whitespace-nowrap py-3 pr-4 text-sm text-text-muted">
          {row.specValues[field.key] ?? '—'}
        </td>
      ))}
      <td className="whitespace-nowrap py-3 pr-4 text-sm font-semibold text-text-primary">
        {row.basePrice != null ? `$${row.basePrice.toFixed(2)}` : '—'}
      </td>
      <td className="whitespace-nowrap py-3 pr-4">
        <label htmlFor={`siblings-qty-${row.id}`} className="sr-only">
          Quantity for {row.title}
        </label>
        <QuantityInput
          id={`siblings-qty-${row.id}`}
          value={quantity}
          onChange={setQuantity}
          className="h-9 w-20 rounded-md border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </td>
      <td className="whitespace-nowrap py-3">
        <Button type="button" variant="outline" onClick={handleAdd}>
          Add
        </Button>
      </td>
    </tr>
  );
}

export function VariantsTable({ variantId }) {
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, isError } = useVariantSiblings(variantId, { all: showAll });

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="h-4 w-24 animate-pulse rounded bg-button-secondary-bg" />
        <div className="mt-3 h-7 w-56 animate-pulse rounded bg-button-secondary-bg" />
        <div className="mt-6 h-40 w-full animate-pulse rounded-lg bg-button-secondary-bg" />
      </section>
    );
  }

  if (isError || !data || data.rows.length === 0) return null;

  const visibleFields = SPEC_FIELDS.filter((field) =>
    data.rows.some((row) => row.specValues[field.key] != null)
  );
  const hasMore = !showAll && data.count > data.rows.length;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Options</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-text-primary">
        Available Options
      </h2>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
              <th className="whitespace-nowrap py-2 pr-4">Variant</th>
              {visibleFields.map((field) => (
                <th key={field.key} className="whitespace-nowrap py-2 pr-4">
                  {field.label}
                </th>
              ))}
              <th className="whitespace-nowrap py-2 pr-4">Price</th>
              <th className="whitespace-nowrap py-2 pr-4">Qty</th>
              <th className="whitespace-nowrap py-2" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <VariantRow
                key={row.id}
                row={row}
                isCurrent={row.id === variantId}
                visibleFields={visibleFields}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="outline" onClick={() => setShowAll(true)}>
            Load all {data.count}
            {data.levelName ? ` in ${data.levelName}` : ''}
          </Button>
        </div>
      )}
    </section>
  );
}
