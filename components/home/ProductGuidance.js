import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const GUIDANCE_ITEMS = [
  {
    title: 'Choose the right material',
    text: 'Compare cord strapping, PET and PP strapping, stretch film, edge protection and other packaging options for the application.',
  },
  {
    title: 'Match the right specifications',
    text: 'Select the appropriate width, thickness, strength, core size and package quantity.',
  },
  {
    title: 'Avoid costly ordering mistakes',
    text: 'Reduce mismatches between strapping, buckles, tools, dimensions and units of measure.',
  },
  {
    title: 'Plan the right buying quantity',
    text: 'Compare case, pallet and container quantities based on how you purchase and ship.',
  },
];

export function ProductGuidance() {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <Image
            src="/hero-product-range.webp"
            alt="ESK Packaging product range: branded tape, corrugated boxes, strapping coils and dispenser carts"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Product Guidance
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Get the right packaging for your application
          </h2>
          <p className="mt-4 max-w-xl text-text-muted">
            Tell us what you&apos;re packing, how it moves, and what
            performance you need. We&apos;ll help you compare materials,
            specifications and buying quantities before you order.
          </p>

          <ol className="mt-8 space-y-6">
            {GUIDANCE_ITEMS.map((item, index) => (
              <li key={item.title} className="flex gap-4">
                <span className="text-2xl font-black leading-none text-border lg:text-3xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-bold text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-sm text-text-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/#quote"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-text-primary"
          >
            <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-primary">
              Get Product Guidance
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
