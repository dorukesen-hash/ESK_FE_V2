'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { canonicalPath } from '@/lib/catalogNodeTree';

// View All Products (a hover-triggered mega menu of every category, see
// MegaMenu below) then Industries We Serve, Knowledge Center, About Us.
// Knowledge Center has no corresponding page here yet, so - matching
// ESK-Website-Frontend's own "never a dead link" rule - it renders
// disabled with a "Coming Soon" tag instead of linking anywhere. Industries
// We Serve has its own page (components/info/IndustriesView.js).
const comingSoonLinks = ['Knowledge Center'];

// A brief grace period before closing on mouseleave: moving the pointer
// from the trigger toward the panel below necessarily crosses the gap
// between them, which would otherwise fire mouseleave on the trigger
// before the pointer ever reaches the panel. The panel's own onMouseEnter
// cancels this timeout if the pointer does land inside it in time.
const CLOSE_DELAY_MS = 150;

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

// Plain link (no Radix DropdownMenu.Item wrapper) - this renders both
// inside the mega menu's portaled panel below (a plain positioned div,
// not a Radix DropdownMenu.Content) and recursively for its own nested
// children, so it can't assume any particular menu component context.
function NavNode({ tree, node, depth }) {
  const link = (
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

// "View All Products" is always a real link (navigates to /search on
// click); hovering it (or the panel it opens) reveals a mega menu listing
// every top-level category and its children, via the unchanged recursive
// NavNode, in a multi-column layout so a shopper can scan every
// department at once. Hovering never fires the link's own click handler,
// so the label's navigation and the panel's reveal never conflict - no
// separate chevron trigger is needed the way a click-toggled disclosure
// would need one.
//
// The panel is portaled to document.body to escape the nav's own
// `overflow-x-auto` scroll row, which (per the CSS overflow spec) also
// clips vertically once any axis is non-`visible` - a plain child here
// would be invisible below the bar's own height. Its position is
// computed from the trigger's on-screen location and recomputed on
// scroll/resize while open, so it doesn't strand itself if the nav row
// (which scrolls horizontally) or the page moves under it. Closing is
// mouseleave-based (with a short grace period, see CLOSE_DELAY_MS) rather
// than outside-click detection, since nothing about a hover menu's close
// condition involves clicking.
function MegaMenu({ tree }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const [position, setPosition] = useState(null);
  const closeTimeoutRef = useRef(null);

  function openNow() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  }

  function scheduleClose() {
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsOpen(false);
    }, CLOSE_DELAY_MS);
  }

  // Navbar lives in the storefront layout, outside {children}, so it is
  // never remounted when a link inside the panel navigates - without
  // this, the panel would stay open and hanging over the destination
  // page until the pointer happens to leave it afterward.
  function closeNow() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(false);
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return undefined;

    function updatePosition() {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom, left: rect.left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative flex shrink-0 items-center"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <Link href="/search" className={itemClass}>
        View All Products →
      </Link>
      {isOpen &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            onMouseEnter={openNow}
            onMouseLeave={scheduleClose}
            onClick={closeNow}
            style={{ position: 'fixed', top: position.top, left: position.left }}
            className="animate-dropdown-in z-20 max-h-[70vh] w-[min(92vw,64rem)] overflow-y-auto rounded-b-lg border border-t-0 border-border bg-surface shadow-lg"
          >
            <div className="h-1 bg-accent" />
            <div className="p-6">
              <div className="columns-2 gap-x-8 sm:columns-3 lg:columns-4">
                {tree.map((node) => (
                  <NavNode key={node.id} tree={tree} node={node} depth={0} />
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function Navbar() {
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
        {tree && <MegaMenu tree={tree} />}

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
