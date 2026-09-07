'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ClaimForm } from './ClaimForm';
import { Button } from '@/components/ui/Button';

export function SupportView() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const openLoginModal = useUIStore((state) => state.openLoginModal);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Support</h1>
      <p className="mt-2 text-text-muted">
        Questions, order issues, or a claim to file — we&apos;re here to help.
      </p>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-semibold text-text-primary">Phone</p>
          <a href="tel:+14699922447" className="text-sm text-text-muted hover:text-text-primary">
            469-992-2447
          </a>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-semibold text-text-primary">Email</p>
          <a
            href="mailto:sales@eskpackaging.com"
            className="text-sm text-text-muted hover:text-text-primary"
          >
            sales@eskpackaging.com
          </a>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-semibold text-text-primary">Address</p>
          <p className="text-sm text-text-muted">2050 Forest Ln #350, Garland, TX 75042</p>
        </div>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-text-primary">File a Claim</h2>
        <p className="mt-2 text-sm text-text-muted">
          Damaged shipment, missing items, or an order issue? Submit a claim
          and our team will follow up.
        </p>

        <div className="mt-4">
          {isLoading ? null : user ? (
            <ClaimForm />
          ) : (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-text-muted">
                Please log in to submit a claim so we can tie it to your
                order history.
              </p>
              <Button onClick={openLoginModal} className="mt-3">
                Log in
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-text-primary">More Resources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/faq" className="text-primary hover:text-primary-hover">
              Frequently Asked Questions
            </Link>
          </li>
          <li>
            <Link href="/shipping-policy" className="text-primary hover:text-primary-hover">
              Shipping Policy
            </Link>
          </li>
          <li>
            <Link href="/return-refund-policy" className="text-primary hover:text-primary-hover">
              Return &amp; Refund Policy
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
