import Image from 'next/image';
import Link from 'next/link';

export function ProductCard({ product }) {
  return (
    <Link href={product.href} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg">
        {product.image && (
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-text-primary">
        {product.title}
      </h3>
      {product.sku && (
        <p className="mt-0.5 text-xs text-text-muted">SKU: {product.sku}</p>
      )}
      {product.price != null && (
        <p className="mt-1 text-sm font-semibold text-text-primary">
          ${product.price.toFixed(2)}
          {product.unit ? ` / ${product.unit}` : ''}
        </p>
      )}
    </Link>
  );
}
