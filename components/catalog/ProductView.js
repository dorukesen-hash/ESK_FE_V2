'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useVariant } from '@/hooks/useVariant';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { findNode, findAncestors, canonicalPath } from '@/lib/catalogNodeTree';
import { slugify } from '@/lib/slugify';
import { Breadcrumbs } from './Breadcrumbs';
import { QuantityInput } from './QuantityInput';
import { VariantsTable } from './VariantsTable';

function useBreadcrumbNodes(tree, nodeId) {
  return useMemo(() => {
    if (!tree || nodeId == null) return { node: null, ancestors: [] };
    const node = findNode(tree, nodeId);
    if (!node) return { node: null, ancestors: [] };
    return { node, ancestors: findAncestors(tree, nodeId) };
  }, [tree, nodeId]);
}

function PriceTiers({ tiers }) {
  if (tiers.length === 0) return null;
  return (
    <table className="mt-6 w-full text-sm">
      <tbody>
        {tiers.map((tier) => (
          <tr key={tier.label} className="border-b border-border">
            <td className="py-2 text-text-muted">{tier.label}</td>
            <td className="py-2 text-right font-semibold text-text-primary">
              ${tier.price.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ProductView({ variantId }) {
  const numericId = Number(variantId);
  const { data: variant, isLoading, isError } = useVariant(numericId);
  const { data: tree } = useCatalogTree();
  const { node, ancestors } = useBreadcrumbNodes(tree, variant?.nodeId);
  const [quantity, setQuantity] = useState(1);
  const [isPallet, setIsPallet] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-button-secondary-bg" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-button-secondary-bg" />
            <div className="h-24 w-full animate-pulse rounded bg-button-secondary-bg" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !variant) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-text-muted">We couldn&apos;t find that product.</p>
        <Link href="/search" className="mt-2 inline-block text-primary hover:text-primary-hover">
          Browse all products
        </Link>
      </main>
    );
  }

  const hasPalletPrice = variant.priceTiers.some((tier) => tier.label === 'Full pallet');

  function handleAddToCart() {
    addItem(numericId, quantity, isPallet);
    openCartDrawer();
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: `/category/${canonicalPath(tree, ancestor.id).join('/')}`,
    })),
    ...(node
      ? [{ label: node.name, href: `/category/${canonicalPath(tree, node.id).join('/')}` }]
      : []),
    { label: variant.title },
  ];

  return (
    <>
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg">
            {variant.images.length > 0 && (
              <Image
                src={variant.images[activeImage]}
                alt={variant.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          {variant.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {variant.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeImage}
                  className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                    index === activeImage ? 'border-accent' : 'border-transparent'
                  }`}
                >
                  <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            {ancestors[0]?.name ?? node?.name ?? 'Product'}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-text-primary md:text-3xl">
            {variant.title}
          </h1>
          {variant.sku && (
            <p className="mt-1 text-sm text-text-muted">SKU: {variant.sku}</p>
          )}

          <PriceTiers tiers={variant.priceTiers} />

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="quantity" className="text-sm font-medium text-text-primary">
                Quantity
              </label>
              <QuantityInput
                id="quantity"
                value={quantity}
                onChange={setQuantity}
                className="mt-1 w-24 rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {hasPalletPrice && (
              <label className="flex items-center gap-2 pb-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={isPallet}
                  onChange={(event) => setIsPallet(event.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Order by full pallet
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Add to Cart
          </button>

          {variant.description && (
            <p className="mt-8 text-sm text-text-muted">{variant.description}</p>
          )}

          {variant.bullets.length > 0 && (
            <ul className="mt-4 space-y-2">
              {variant.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm text-text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {variant.specs.length > 0 && (
            <table className="mt-8 w-full text-sm">
              <tbody>
                {variant.specs.map((spec) => (
                  <tr key={spec.label} className="border-b border-border">
                    <td className="py-2 text-text-muted">{spec.label}</td>
                    <td className="py-2 text-right text-text-primary">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>

    {node?.variants?.length > 0 && (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Options</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-text-primary">
          Available Options
        </h2>
        <div className="mt-6">
          <VariantsTable
            variants={node.variants}
            currentVariantId={numericId}
            productSlug={slugify(node.name) || String(node.id)}
          />
        </div>
      </section>
    )}
    </>
  );
}
