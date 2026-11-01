import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const SLIDE = {
  image: '/hero-strapping.jpg',
  alt: 'Composite and woven strapping rolls with strapping tensioner tools',
  kicker: 'Industrial Packaging Supply',
  title: 'Industrial packaging supplies for every business',
  subtitle: 'Strapping, tools, stretch film and more, sourced and shipped in bulk.',
  cta: { label: 'Shop Products', href: '/search' },
};

export function HeroBanner() {
  return (
    <section aria-label="Featured highlights" className="relative overflow-hidden bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col sm:h-[600px] sm:flex-row">
        {/* Image panel: full-bleed on mobile, angled full-height panel on desktop */}
        <div className="relative h-64 w-full sm:absolute sm:inset-y-0 sm:right-0 sm:h-full sm:w-[58%] sm:[clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)]">
          <Image
            src={SLIDE.image}
            alt={SLIDE.alt}
            fill
            priority
            sizes="(min-width: 640px) 58vw, 100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink/25" />
        </div>

        {/* Text panel */}
        <div className="relative z-10 flex w-full flex-col justify-center px-6 py-10 sm:w-[46%] sm:px-10 sm:py-0 lg:px-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            {SLIDE.kicker}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {SLIDE.title}
          </h1>
          <p className="mt-5 max-w-sm text-sm text-on-ink-muted sm:text-base">
            {SLIDE.subtitle}
          </p>
          <Link
            href={SLIDE.cta.href}
            className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white"
          >
            <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-accent">
              {SLIDE.cta.label}
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
