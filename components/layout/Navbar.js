'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { canonicalPath } from '@/lib/catalogNodeTree';

// Item set mirrors ESK-Website-Frontend's navbar (content/navigation.js):
// every top-level category always visible (not hidden behind one shared
// dropdown), then View All Products, Industries We Serve, Knowledge Center,
// About Us. Knowledge Center has no corresponding page here yet, so -
// matching that project's own "never a dead link" rule - it renders
// disabled with a "Coming Soon" tag instead of linking anywhere. Industries
// We Serve now has its own page (components/info/IndustriesView.js).
const comingSoonLinks = ['Knowledge Center'];

const itemClass =
  'flex h-14 shrink-0 items-center whitespace-nowrap px-4 text-sm font-semibold text-on-ink transition-colors hover:bg-ink-elevated hover:text-accent active:translate-y-px';

const chevronButtonClass =
  'flex h-14 shrink-0 items-center px-2 text-on-ink transition-colors hover:bg-ink-elevated hover:text-accent';

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

// One top-level category: its label is always a real, standalone link
// (navigates on click, no other behavior attached to it); if it has
// children, a *separate* chevron button opens a compact dropdown listing
// just that node's own children via the unchanged recursive NavNode. The
// label and the chevron are deliberately two different elements - a single
// element that is both a navigation link and a Radix dropdown trigger
// would fire both behaviors on one click, which is the conflict this
// split avoids.
function CategoryItem({ tree, node, openId, setOpenId }) {
  const isOpen = openId === node.id;
  const hasChildren = node.children?.length > 0;

  return (
    <div className="flex shrink-0 items-center">
      <Link href={navHref(tree, node.id)} className={itemClass}>
        {node.name}
      </Link>
      {hasChildren && (
        <DropdownMenu.Root
          open={isOpen}
          onOpenChange={(next) => setOpenId(next ? node.id : null)}
          modal={false}
        >
          <DropdownMenu.Trigger
            aria-label={`${node.name} submenu`}
            className={`${chevronButtonClass} ${isOpen ? 'bg-ink-elevated text-accent' : ''}`}
          >
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={0}
              className="animate-dropdown-in z-20 min-w-[220px] rounded-b-lg border border-t-0 border-border bg-surface p-4 shadow-lg"
            >
              {node.children.map((child) => (
                <NavNode key={child.id} tree={tree} node={child} depth={0} />
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}

export function Navbar() {
  // Only one category's dropdown may be open at a time - tracked as the
  // single open node's id (or null) rather than per-node boolean state,
  // so opening a second category's dropdown implicitly closes the first.
  const [openId, setOpenId] = useState(null);
  const { data: tree, isLoading, isError } = useCatalogTree();

  return (
    <nav aria-label="Primary" className="border-b border-on-ink-border bg-ink">
      <div className="scrollbar-hide mx-auto flex max-w-6xl items-center overflow-x-auto px-6">
        {isLoading && (
          <p className="px-4 text-sm text-on-ink-muted" aria-live="polite">
            Loading categories…
          </p>
        )}
        {isError && (
          <p className="px-4 text-sm text-on-ink-muted" role="alert">
            Categories unavailable.
          </p>
        )}
        {tree &&
          tree.map((node) => (
            <CategoryItem
              key={node.id}
              tree={tree}
              node={node}
              openId={openId}
              setOpenId={setOpenId}
            />
          ))}

        <Link href="/search" className={itemClass}>
          View All Products →
        </Link>

        <Link href="/industries" className={itemClass}>
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
