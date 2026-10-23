'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { canonicalPath } from '@/lib/catalogNodeTree';

// Item set mirrors ESK-Website-Frontend's navbar (content/navigation.js):
// a "Shop Products" mega menu followed by Industries We Serve, Knowledge
// Center, About Us. Knowledge Center has no corresponding page here yet, so
// — matching that project's own "never a dead link" rule — it renders
// disabled with a "Coming Soon" tag instead of linking anywhere. Industries
// We Serve now has a real homepage section (#industries).
const comingSoonLinks = ['Knowledge Center'];

const itemClass =
  'flex h-14 shrink-0 items-center whitespace-nowrap px-4 text-sm font-semibold text-on-ink transition-colors hover:bg-ink-elevated hover:text-accent active:translate-y-px';

function ComingSoonItem({ label }) {
  return (
    <span
      aria-disabled="true"
      className={`${itemClass} cursor-default text-on-ink-muted hover:bg-transparent hover:text-on-ink-muted active:translate-y-0`}
    >
      {label}
      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-on-ink-muted/70">
        Coming Soon
      </span>
    </span>
  );
}

function navHref(tree, nodeId) {
  return `/category/${canonicalPath(tree, nodeId).join('/')}`;
}

function NavNode({ tree, node, depth }) {
  const link = (
    <DropdownMenu.Item asChild>
      <Link
        href={navHref(tree, node.id)}
        className={
          depth === 0
            ? 'block text-sm font-bold uppercase tracking-wide text-text-primary transition-colors hover:text-primary'
            : 'block text-sm text-text-muted transition-colors hover:text-primary'
        }
      >
        {node.name}
      </Link>
    </DropdownMenu.Item>
  );

  const nested = node.children?.length > 0 && (
    <ul className="mt-3 space-y-1.5 border-l-2 border-accent-tint-strong pl-3">
      {node.children.map((child) => (
        <li key={child.id}>
          <NavNode tree={tree} node={child} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );

  if (depth === 0) {
    return (
      <div className="mb-6 break-inside-avoid">
        {link}
        {nested}
      </div>
    );
  }

  return (
    <>
      {link}
      {nested}
    </>
  );
}

export function Navbar() {
  const [shopOpen, setShopOpen] = useState(false);
  const { data: tree, isLoading, isError } = useCatalogTree();

  return (
    <nav aria-label="Primary" className="border-b border-on-ink-border bg-ink">
      <div className="scrollbar-hide mx-auto flex max-w-6xl items-center overflow-x-auto px-6">
        <DropdownMenu.Root open={shopOpen} onOpenChange={setShopOpen}>
          <DropdownMenu.Trigger
            className={`${itemClass} ${shopOpen ? 'bg-ink-elevated text-accent' : ''}`}
          >
            Shop Products
            <ChevronDown
              aria-hidden="true"
              className={`ml-1 h-4 w-4 transition-transform ${shopOpen ? 'rotate-180' : ''}`}
            />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={0}
              className="animate-dropdown-in z-20 w-[min(92vw,64rem)] rounded-b-lg border border-t-0 border-border bg-surface shadow-lg"
            >
              <div className="h-1 bg-accent" />
              <div className="p-6">
                {isLoading && (
                  <p className="text-sm text-text-muted" aria-live="polite">
                    Loading categories…
                  </p>
                )}
                {isError && (
                  <p className="text-sm text-text-muted" role="alert">
                    Categories unavailable.
                  </p>
                )}
                {tree && tree.length > 0 && (
                  <div className="columns-2 gap-x-8 sm:columns-3 lg:columns-4">
                    {tree.map((node) => (
                      <NavNode key={node.id} tree={tree} node={node} depth={0} />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border px-6 py-3 text-right">
                <DropdownMenu.Item asChild>
                  <Link
                    href="/search"
                    className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    View All Products →
                  </Link>
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <Link href="/#industries" className={itemClass}>
          Industries We Serve
        </Link>

        {comingSoonLinks.map((label) => (
          <ComingSoonItem key={label} label={label} />
        ))}

        <Link href="/about-us" className={itemClass}>
          About Us
        </Link>
      </div>
    </nav>
  );
}
