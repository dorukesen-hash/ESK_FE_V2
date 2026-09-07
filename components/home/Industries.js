import Image from 'next/image';
import Link from 'next/link';

const INDUSTRIES = [
  {
    name: 'Lumber, Doors & Building Materials',
    text: 'Secure long and heavy bundles with high-strength cord strapping, corner boards and application tools.',
    image: {
      src: '/industry-lumber.webp',
      alt: 'Lumber bundle secured with composite cord strapping and a wire buckle',
    },
    href: '/category/cord-strapping',
  },
  {
    name: 'Manufacturing & Metalworking',
    text: 'Strap, lash and protect machinery, metal products and demanding industrial loads.',
    image: {
      src: '/industry-manufacturing.webp',
      alt: 'Machine housings strapped to wooden crate bases with cord strapping and buckles',
    },
    href: '/category/lashing-equipment',
  },
  {
    name: 'Warehousing, 3PL & Distribution',
    text: 'Standardize pallet wrapping, load containment and replenishment across high-volume shipping operations.',
    image: {
      src: '/industry-warehousing.jpg',
      alt: 'Palletized boxes braced inside a shipping container',
    },
    href: '/category/stretch-film',
  },
];

export function Industries() {
  return (
    <section id="industries" className="scroll-mt-20 bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Industries We Serve
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Packaging solutions built for the way your industry ships
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Link key={industry.name} href={industry.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={industry.image.src}
                  alt={industry.image.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-base font-bold text-white">{industry.name}</h3>
                  <p className="mt-1 text-xs text-white/70">{industry.text}</p>
                  <span className="mt-2 inline-block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
