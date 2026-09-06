'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    theme: 'light',
  },
  {
    image: '/hero-product-range.webp',
    alt: 'ESK Packaging product range: branded tape, corrugated boxes, strapping coils, stretch film and dispenser carts',
    kicker: 'Full Product Range',
    title: "Everything your warehouse needs, in one order",
    subtitle: 'Boxes, tape, film and equipment, stocked and ready to ship.',
    cta: { label: 'Browse Categories', href: '/#categories' },
    theme: 'light',
    imagePosition: 'object-bottom',
  },
  {
    image: '/hero-industrial.webp',
    alt: 'Industrial machinery secured to a wooden pallet with cord strapping',
    kicker: 'Built For Industry',
    title: 'Packaging solutions for demanding industrial loads',
    subtitle: 'From machinery to lumber, we help you secure what matters.',
    cta: { label: 'About ESK', href: '/about-us' },
    theme: 'dark',
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      className="relative h-[520px] overflow-hidden bg-ink sm:h-[600px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className={`flex h-full ${prefersReducedMotion ? '' : 'transition-transform duration-700 ease-in-out'}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.image}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${SLIDES.length}`}
            aria-hidden={slideIndex !== index}
            className="relative h-full w-full shrink-0"
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={slideIndex === 0}
              sizes="100vw"
              className={`object-cover ${slide.imagePosition ?? ''}`}
            />
            <div
              aria-hidden="true"
              className={
                slide.theme === 'dark'
                  ? 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent'
                  : 'absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent'
              }
            />
            <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16 sm:pb-20">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  {slide.kicker}
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-md text-base text-white/80 sm:text-lg">
                  {slide.subtitle}
                </p>
                <Link
                  href={slide.cta.href}
                  className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  {slide.cta.label}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:flex"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:flex"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => goTo(slideIndex)}
            aria-label={`Go to slide ${slideIndex + 1}`}
            aria-current={slideIndex === index}
            className={`h-2 rounded-full transition-colors ${
              slideIndex === index ? 'w-6 bg-accent' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
