import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';

export default function HomePage() {
  return (
    <main>
      <HeroBanner />

      <section id="categories" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Full Product Range
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
              Shop by category
            </h2>
          </div>
          <Link
            href="/search"
            className="group mb-1 inline-flex items-center gap-2 text-sm font-semibold text-text-primary"
          >
            <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-primary">
              View All Products
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
        <div className="mt-10">
          <CategoryShowcase />
        </div>
      </section>
    </main>
  );
}
