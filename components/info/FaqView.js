'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { InfoBanner } from './InfoBanner';

const emailLink = (
  <a href="mailto:sales@eskpackaging.com" className="text-primary hover:text-primary-hover">
    sales@eskpackaging.com
  </a>
);

const faqSections = [
  {
    id: 'ordering',
    label: 'Ordering & Account',
    items: [
      {
        q: 'How do I place an order?',
        a: (
          <>
            Browse our product catalog, add items to your cart, and proceed
            to checkout. Need a custom quote or a bulk order? Contact us at{' '}
            {emailLink}.
          </>
        ),
      },
      {
        q: 'Can I place an order without creating an account?',
        a: 'Yes, guest checkout is available. Creating an account lets you view order history, save addresses, and manage billing information.',
      },
      {
        q: 'How do I apply for Net 30 terms or open a business account?',
        a: <>Email your business credentials to {emailLink} and we&apos;ll follow up with a credit application.</>,
      },
      {
        q: 'How do I reset my password?',
        a: "Click \"Forgot your password?\" on the login screen and follow the instructions sent to your email.",
      },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping & Delivery',
    items: [
      {
        q: 'What carriers do you use?',
        a: 'We ship via FedEx, UPS, and common carriers based on shipment size and type.',
      },
      {
        q: 'How long will my order take to arrive?',
        a: 'Orders are processed within 1–2 business days. Delivery typically takes 2–5 business days depending on your location.',
      },
      {
        q: 'How can I track my shipment?',
        a: "You'll receive a confirmation email with a tracking number once your order ships. Please allow up to 48 hours for tracking information to update.",
      },
    ],
  },
  {
    id: 'returns',
    label: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: (
          <>
            We accept returns within 30 days of delivery. See our{' '}
            <Link href="/return-refund-policy" className="text-primary hover:text-primary-hover">
              Return &amp; Refund Policy
            </Link>{' '}
            for full details.
          </>
        ),
      },
      {
        q: 'How do I start a return?',
        a: <>Email {emailLink} with your order number and return reason and we&apos;ll provide an RMA number.</>,
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 7–10 business days after we inspect the returned items.',
      },
    ],
  },
  {
    id: 'payment',
    label: 'Payment & Billing',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept major credit and debit cards through Stripe, our secure payment processor.',
      },
      {
        q: 'How do I get a copy of my invoice?',
        a: <>Invoices are available in your account under Orders. You can also request one at {emailLink}.</>,
      },
    ],
  },
];

function matchesSearch(item, query) {
  if (!query) return true;
  const haystack = `${item.q} ${typeof item.a === 'string' ? item.a : ''}`.toLowerCase();
  return haystack.includes(query);
}

export function FaqView() {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();

  return (
    <main>
      <InfoBanner
        kicker="We're Here to Help"
        title="Frequently Asked Questions"
        subtitle="Ordering, shipping, returns, and billing — answered."
      />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          />
          <label htmlFor="faq-search" className="sr-only">
            Search FAQ
          </label>
          <input
            id="faq-search"
            type="search"
            placeholder="Search FAQ…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-full border border-border py-2.5 pl-11 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mt-10 space-y-10">
          {faqSections.map((section, index) => {
            const items = section.items.filter((item) => matchesSearch(item, query));
            if (items.length === 0) return null;
            return (
              <section key={section.id}>
                <div className="flex items-baseline gap-4">
                  <span aria-hidden="true" className="text-2xl font-black text-accent/30">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-lg font-bold text-text-primary">{section.label}</h2>
                </div>
                <div className="mt-2">
                  <Accordion items={items} />
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-lg font-bold text-text-primary">Policies</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/terms-and-conditions" className="text-primary hover:text-primary-hover">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="text-primary hover:text-primary-hover">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="text-primary hover:text-primary-hover">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/return-refund-policy" className="text-primary hover:text-primary-hover">
                Return & Refund Policy
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
