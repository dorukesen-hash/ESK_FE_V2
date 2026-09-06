'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';

function formatPrice(price, unit) {
  if (price == null) return null;
  const amount = `$${price.toFixed(2)}`;
  return unit ? `${amount} / ${unit}` : amount;
}

function FeaturedCard({ product, index }) {
  const price = formatPrice(product.price, product.unit);

  return (
    <Link href={product.href} className="group flex flex-col overflow-hidden rounded-lg border border-border sm:flex-row">
      <div className="relative h-56 w-full shrink-0 overflow-hidden bg-button-secondary-bg sm:h-auto sm:w-2/5">
        {product.image && (
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(min-width: 640px) 20vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute -bottom-6 -left-6 h-16 w-16 rotate-45 bg-ink" />
        <span className="absolute bottom-2 left-2 text-xs font-bold text-accent">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Featured</p>
        <h3 className="text-lg font-bold leading-snug text-text-primary">{product.title}</h3>
        {price && <p className="text-sm text-text-muted">{price}</p>}
        <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-primary">
            View Details
          </span>
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}

export function FeaturedProducts() {
  const { data: products, isLoading, isError } = useFeaturedProducts();

  if (!isLoading && !isError && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
        Hand-Picked
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Featured products
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {isLoading &&
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-lg bg-button-secondary-bg"
            />
          ))}
        {isError && (
          <p className="text-sm text-text-muted">Featured products unavailable.</p>
        )}
        {products?.map((product, index) => (
          <FeaturedCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
