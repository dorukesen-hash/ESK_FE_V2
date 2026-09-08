import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';
import { InfoBanner } from './InfoBanner';

const PILLARS = [
  {
    title: 'Low Price Guarantee',
    text: "We'll meet or beat any total order price for the identical product and quantity. Don't be misled by the \"free shipping\" some competitors offer — the freight costs are padded back into the price of the product.",
  },
  {
    title: 'Fast Shipping',
    text: 'Fast and reliable shipping on all orders. Most stock orders placed by 2:00 p.m. EST ship the very same day. If your order requires faster service, let us know.',
  },
  {
    title: '100% Satisfaction Guarantee',
    text: "If you're not 100% satisfied with your order, we accept returns within 30 days of the delivery date. Contact Customer Service and we'll help you arrange the return and provide a replacement. Non-defective returns are subject to a 15% restocking fee.",
  },
  {
    title: 'Quality Assurance',
    text: "We understand that our customers' trust hinges on the quality of our products. That's why quality assurance isn't just a process — it's a promise that every product we sell is designed and manufactured to meet the highest standards of performance and reliability.",
  },
];

export function AboutUsView() {
  return (
    <main>
      <InfoBanner
        kicker="Since 2021"
        title="Who We Are at ESK Packaging"
        subtitle="More than a packaging materials supplier — your partner in delivering quality and value."
      />

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4 text-sm leading-relaxed text-text-muted">
          <p>
            Established in 2021, ESK Packaging is more than a packaging
            materials supplier — we&apos;re your partner in delivering
            quality and value. We specialize in supplying businesses across
            the country with the highest quality industrial packaging
            materials.
          </p>
          <p>
            From humble beginnings in a small warehouse, we&apos;ve grown
            into a trusted supplier for businesses big and small across the
            nation. Our focus has always been on quality, affordability, and
            exceptional customer service. We&apos;re proud of the reputation
            we&apos;ve built and are committed to continually improving our
            products and services to better serve our customers.
          </p>
          <p>
            We offer a wide range of product lines, from strapping and
            stretch film through to edge &amp; corner protectors, tools, and
            accessories.
          </p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
          <Image
            src="/hero-product-range.webp"
            alt="ESK Packaging product range: branded tape, corrugated boxes, strapping coils, stretch film and dispenser carts"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover object-bottom"
          />
        </div>
      </div>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Why ESK
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            What Sets Us Apart
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
            {PILLARS.map((pillar, index) => (
              <div key={pillar.title} className="flex gap-5">
                <span
                  aria-hidden="true"
                  className="shrink-0 text-3xl font-black leading-none text-accent/25"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-bold text-text-primary">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                    {pillar.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Get in Touch
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            We&apos;d love to hear from you
          </h2>

          <ul className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-8">
            <li className="flex items-center gap-2 text-text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              2050 Forest Ln #350, Garland, TX 75042
            </li>
            <li>
              <a
                href="tel:+14699922447"
                className="flex items-center gap-2 text-text-primary transition-colors hover:text-primary"
              >
                <Phone aria-hidden="true" className="h-4 w-4 text-accent" />
                469-992-2447
              </a>
            </li>
            <li>
              <a
                href="mailto:sales@eskpackaging.com"
                className="flex items-center gap-2 text-text-primary transition-colors hover:text-primary"
              >
                <Mail aria-hidden="true" className="h-4 w-4 text-accent" />
                sales@eskpackaging.com
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
