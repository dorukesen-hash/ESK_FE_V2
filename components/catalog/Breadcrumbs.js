'use client';

import Link from 'next/link';
import { useElementHeightVar } from '@/hooks/useElementHeightVar';

export function Breadcrumbs({ items }) {
  const ref = useElementHeightVar('--breadcrumbs-height');

  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className="breadcrumbs-sticky bg-background py-3 text-sm text-text-muted"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-primary">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
