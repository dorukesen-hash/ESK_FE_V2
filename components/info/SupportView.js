'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ClaimForm } from './ClaimForm';
import { Button } from '@/components/ui/Button';
import { InfoBanner } from './InfoBanner';

const CONTACT_CARDS = [
  {
    icon: Phone,
    label: 'Phone',
    value: '469-992-2447',
    href: 'tel:+14699922447',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'sales@eskpackaging.com',
    href: 'mailto:sales@eskpackaging.com',
  },
];

export function SupportView() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const openLoginModal = useUIStore((state) => state.openLoginModal);

  return (
    <main>
      <InfoBanner
        kicker="Support"
        title="Questions, order issues, or a claim to file?"
        subtitle="We're here to help — reach out directly or submit a claim below."
      />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTACT_CARDS.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              className="group rounded-lg border border-border p-5 transition-colors hover:border-primary"
            >
              <Icon aria-hidden="true" className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold text-text-primary">{label}</p>
              <p className="mt-1 text-sm text-text-muted transition-colors group-hover:text-primary">
                {value}
              </p>
            </a>
          ))}
          <div className="rounded-lg border border-border p-5">
            <MapPin aria-hidden="true" className="h-5 w-5 text-accent" />
            <p className="mt-3 text-sm font-semibold text-text-primary">Address</p>
            <p className="mt-1 text-sm text-text-muted">
              2050 Forest Ln #350, Garland, TX 75042
            </p>
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            File a Claim
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
            Damaged shipment or missing items?
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Submit a claim and our team will follow up by email.
          </p>

          <div className="mt-6">
            {isLoading ? null : user ? (
              <ClaimForm />
            ) : (
              <div className="rounded-lg border border-border p-6">
                <p className="text-sm text-text-muted">
                  Please log in to submit a claim so we can tie it to your
                  order history.
                </p>
                <Button onClick={openLoginModal} className="mt-4">
                  Log in
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-10">
          <h2 className="text-lg font-bold text-text-primary">More Resources</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { href: '/faq', label: 'Frequently Asked Questions' },
              { href: '/shipping-policy', label: 'Shipping Policy' },
              { href: '/return-refund-policy', label: 'Return & Refund Policy' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  {link.label}
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
