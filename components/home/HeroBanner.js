'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(callback) {
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener('change', callback);
  return () => mediaQueryList.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

const SLIDES = [
  {
    image: '/hero-strapping.jpg',
    alt: 'Composite and woven strapping rolls with strapping tensioner tools',
    kicker: 'Industrial Packaging Supply',
    title: 'Industrial packaging supplies for every business',
    subtitle:
      'Strapping, tools, stretch film and more, sourced and shipped in bulk.',
    cta: { label: 'Shop Products', href: '/search' },
  },
  {
    image: '/hero-product-range.webp',
    alt: 'ESK Packaging product range: branded tape, corrugated boxes, strapping coils, stretch film and dispenser carts',
    kicker: 'Full Product Range',
    title: 'Everything your warehouse needs, in one order',
    subtitle: 'Boxes, tape, film and equipment, stocked and ready to ship.',
    cta: { label: 'Browse Categories', href: '/#categories' },
    imagePosition: 'object-bottom',
  },
  {
    image: '/hero-industrial.webp',
    alt: 'Industrial machinery secured to a wooden pallet with cord strapping',
    kicker: 'Built For Industry',
    title: 'Packaging solutions for demanding industrial loads',
    subtitle: 'From machinery to lumber, we help you secure what matters.',
    cta: { label: 'About ESK', href: '/about-us' },
  },
];

const AUTOPLAY_MS = 6000;

export function HeroBanner() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const goTo = useCallback((next) => {
    setIndex((current) => (next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const slide = SLIDES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      className="relative overflow-hidden bg-ink"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="mx-auto flex max-w-7xl flex-col sm:h-[600px] sm:flex-row">
        {/* Image panel: full-bleed on mobile, angled full-height panel on desktop */}
        <div className="relative h-64 w-full sm:absolute sm:inset-y-0 sm:right-0 sm:h-full sm:w-[58%] sm:[clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)]">
          {SLIDES.map((s, slideIndex) => (
            <Image
              key={s.image}
              src={s.image}
              alt={s.alt}
              fill
              priority={slideIndex === 0}
              sizes="(min-width: 640px) 58vw, 100vw"
              className={`object-cover ${s.imagePosition ?? ''} transition-opacity duration-700 ${
                slideIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={slideIndex !== index}
            />
          ))}
          <div aria-hidden="true" className="absolute inset-0 bg-ink/25" />
        </div>

        {/* Text panel */}
        <div className="relative z-10 flex w-full flex-col justify-center px-6 py-10 sm:w-[46%] sm:px-10 sm:py-0 lg:px-14">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 select-none text-[220px] font-black leading-none text-on-ink/[0.06] lg:block"
          >
            0{index + 1}
          </span>

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
              {slide.kicker}
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-sm text-sm text-on-ink-muted sm:text-base">
              {slide.subtitle}
            </p>
            <Link
              href={slide.cta.href}
              className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white"
            >
              <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-accent">
                {slide.cta.label}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-5">
            {SLIDES.map((s, slideIndex) => (
              <button
                key={s.image}
                type="button"
                onClick={() => goTo(slideIndex)}
                aria-label={`Go to slide ${slideIndex + 1}`}
                aria-current={slideIndex === index}
                className={`text-sm font-bold transition-colors ${
                  slideIndex === index ? 'text-accent' : 'text-on-ink-muted hover:text-white'
                }`}
              >
                0{slideIndex + 1}
              </button>
            ))}
          </div>
          <div className="relative mt-3 h-px w-32 bg-on-ink-border">
            <div
              key={index}
              className="absolute inset-y-0 left-0 w-full bg-accent animate-slide-progress"
              style={{
                animationDuration: `${AUTOPLAY_MS}ms`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
