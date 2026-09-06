import Image from 'next/image';
import Link from 'next/link';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';

export default function HomePage() {
  return (
    <main>
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:grid-cols-2 sm:py-24">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
              Packaging your business can rely on.
            </h1>
            <p className="mt-6 max-w-md text-lg text-text-muted">
              Strapping, stretch film, boxes and edge protection, sourced and
              shipped in bulk for warehouses and distribution teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/search"
                className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Shop Products
              </Link>
              <Link
                href="/about-us"
                className="inline-flex h-12 items-center rounded-full border border-border px-6 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
              >
                About ESK
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/hero-warehouse.jpg"
              alt="Pallets of packaging supplies staged in an ESK Packaging warehouse"
              fill
              priority
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          Shop by category
        </h2>
        <p className="mt-2 text-text-muted">
          Browse our full catalog of industrial packaging supplies.
        </p>
        <div className="mt-8">
          <CategoryShowcase />
        </div>
      </section>
    </main>
  );
}
