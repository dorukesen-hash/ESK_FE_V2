'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Phone, Mail, MapPin } from 'lucide-react';

const HELP_POINTS = [
  'Product selection support, comparing materials, specifications and buying quantities for your application.',
  'Bulk-order and volume pricing for pallet and container quantities.',
  'Custom-product assistance, including custom corner boards and custom boxes.',
];

const FAMILIES = [
  'Strapping & Load Securement',
  'Edge Protection',
  'Stretch Film',
  'Boxes & Mailers',
  'Tools & Accessories',
];

const CONTACT = {
  phone: { label: '469-992-2447', href: 'tel:+14699922447' },
  email: { label: 'sales@eskpackaging.com', href: 'mailto:sales@eskpackaging.com' },
  address: '2050 Forest Ln #350, Garland, TX 75042',
};

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  company: yup.string().required('Company is required'),
  message: yup.string().required('Message is required'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function QuoteView() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  function onSubmit(values) {
    // No backend quote endpoint exists yet (ESK_API has shipping-rate quotes
    // only, not a sales lead form) - hand the request to the visitor's own
    // email client so nothing is silently lost, same approach
    // ESK-Website-Frontend uses for the same reason.
    const subject = encodeURIComponent(`Quote request - ${values.company}`);
    const body = encodeURIComponent(
      `Name: ${values.name}\nCompany: ${values.company}\nEmail: ${values.email}\n\n${values.message}`
    );
    window.location.assign(`mailto:${CONTACT.email.label}?subject=${subject}&body=${body}`);
    reset();
  }

  return (
    <main id="quote" className="scroll-mt-20 bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 border-t border-border px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Request a Quote
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Tell us what you need quoted
          </h1>
          <p className="mt-4 max-w-md text-text-muted">
            Our team will follow up with pricing and availability for pallet
            and container quantities.
          </p>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-primary">
            How our sales team helps
          </h3>
          <ul className="mt-3 space-y-2">
            {HELP_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-text-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {point}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-primary">
            Product families we quote
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {FAMILIES.map((family) => (
              <li
                key={family}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-muted"
              >
                {family}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wide text-text-primary">
            Prefer to reach us directly?
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={CONTACT.phone.href}
                className="inline-flex items-center gap-2 text-text-primary transition-colors hover:text-primary"
              >
                <Phone aria-hidden="true" className="h-4 w-4 text-accent" />
                {CONTACT.phone.label}
              </a>
            </li>
            <li>
              <a
                href={CONTACT.email.href}
                className="inline-flex items-center gap-2 text-text-primary transition-colors hover:text-primary"
              >
                <Mail aria-hidden="true" className="h-4 w-4 text-accent" />
                {CONTACT.email.label}
              </a>
            </li>
            <li className="flex items-center gap-2 text-text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              {CONTACT.address}
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="quote-name" className="text-sm font-medium text-text-primary">
              Name
            </label>
            <input id="quote-name" {...register('name')} className={fieldClass} />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quote-email" className="text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="quote-email"
              type="email"
              {...register('email')}
              className={fieldClass}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quote-company" className="text-sm font-medium text-text-primary">
              Company
            </label>
            <input id="quote-company" {...register('company')} className={fieldClass} />
            {errors.company && (
              <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quote-message" className="text-sm font-medium text-text-primary">
              What do you need quoted?
            </label>
            <textarea
              id="quote-message"
              rows={4}
              placeholder="Product, size, quantity, destination..."
              {...register('message')}
              className={fieldClass}
            />
            {errors.message && (
              <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Send Quote Request
          </button>
          <p className="text-xs text-text-muted">
            Your request opens in your email client, addressed to{' '}
            {CONTACT.email.label}.
          </p>
        </form>
      </div>
    </main>
  );
}
