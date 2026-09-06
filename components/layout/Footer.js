import Image from 'next/image';
import Link from 'next/link';

const companyLinks = [
  { href: '/about-us', label: 'About Us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
];

const policyLinks = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
  { href: '/return-refund-policy', label: 'Return & Refund Policy' },
  { href: '/terms-and-conditions', label: 'Terms and Conditions' },
];

function FooterLinkList({ title, links }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-text-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <Image
              src="/esk-icon.png"
              alt="ESK Packaging"
              width={168}
              height={24}
              className="h-6 w-auto"
            />
            <p className="mt-4 text-sm text-text-muted">
              Industrial packaging products, sourced and shipped for your business.
            </p>
          </div>
          <FooterLinkList title="Company" links={companyLinks} />
          <FooterLinkList title="Policies" links={policyLinks} />
        </div>
        <div className="mt-10 border-t border-border pt-6 text-sm text-text-muted">
          © {new Date().getFullYear()} ESK Packaging. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
