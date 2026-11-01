# Nav and Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every top-level catalog category always visible in the nav bar (instead of hidden behind one "Shop Products" dropdown), simplify the hero to a single static banner, and move three homepage "storytelling" sections (Industries, Quote, Product Guidance's link target) off the homepage onto their own pages without deleting them.

**Architecture:** `Navbar.js` changes from one shared `DropdownMenu.Root` wrapping all 10 top-level nodes to one `DropdownMenu.Root` per node, each gated by a single `openId` state value so only one category's dropdown is ever open at a time; each node's children render via the existing recursive `NavNode` component, reused with no internal changes. `HeroBanner.js` drops its carousel state/effects entirely, keeping only the static visual shell. `Industries.js` and `QuoteSection.js` move file-for-file into `components/info/` (this repo's existing convention for standalone content pages) behind new routes; `app/(storefront)/page.js` stops importing and rendering them, plus `FeaturedProducts`/`ProductGuidance` is addressed where its one changed link lives.

**Tech Stack:** Next.js, Tailwind, Radix UI (`@radix-ui/react-dropdown-menu`), Vitest + React Testing Library + `@testing-library/user-event` (matching this repo's existing conventions in `Navbar.test.jsx`/`HeroBanner.test.jsx`).

**Spec:** `docs/superpowers/specs/2026-11-01-nav-and-homepage-redesign.md`

## Global Constraints

- Each top-level category is a real `<Link>` to its own category page. If (and only if) it has children, a *separate* chevron button beside the label opens a compact dropdown of just that node's own children — the label and the chevron are never the same clickable element.
- Only one category's dropdown may be open at a time.
- "View All Products" renders as its own standalone bar link, never nested inside any category's dropdown.
- "Industries We Serve" links to `/industries`, never `/#industries`.
- `Industries`, `QuoteSection`, and `ProductGuidance`'s content/behavior are preserved exactly — these are moves and one link-target change, never content rewrites.
- `CategoryShowcase` and `FeaturedProducts` keep rendering on the homepage, unchanged.
- No second search input is added anywhere in this plan — the existing global header search is the only one.

## Review Focus

- A top-level category with zero children must render as a plain link with no chevron/dropdown affordance at all — not an empty, dead-clicking dropdown trigger.
- Opening one category's dropdown and then clicking a different category's chevron must close the first dropdown and open only the second — never two open at once.
- Every file that currently imports the old `components/home/Industries`/`components/home/QuoteSection` paths must be updated or the old files deleted outright — a stale import left anywhere breaks the build, it doesn't just misbehave quietly. Each move task's own steps grep-confirm no remaining reference to the old path.
- Simplifying `HeroBanner.js` must also delete the tests for the removed autoplay/reduced-motion/tab-navigation mechanism, not just stop testing them implicitly — a stale test asserting behavior that no longer exists (e.g. advancing fake timers and expecting a slide change) would either fail loudly (good) or, worse, pass vacuously if written carelessly; this plan's Task 2 replaces the whole test file rather than leaving old cases in place.
- Removing `ProductGuidance`/`Industries`/`QuoteSection` from the homepage must not leave the homepage's own test suite (or any other page) asserting on their presence there — Task 6 adds the homepage's own first-ever test file precisely to pin "these three are gone, these three remain" as an explicit, checked fact rather than an assumption.

---

## Task 1: Navbar — every category always visible, one dropdown per category

**Files:**
- Modify: `components/layout/Navbar.js` (full rewrite below)
- Modify: `components/layout/Navbar.test.jsx` (full rewrite below)

**Interfaces:**
- Produces: `Navbar()` — no props, unchanged external interface. Internal: a new `CategoryItem({ tree, node, openId, setOpenId })` helper, not exported, not consumed by any other task.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `components/layout/Navbar.test.jsx` with:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { Navbar } from './Navbar';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

describe('Navbar', () => {
  it('renders About Us as a real link', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute(
      'href',
      '/about-us'
    );
  });

  it('renders Knowledge Center as a disabled, non-navigating item', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);

    const item = screen.getByText('Knowledge Center').closest('[aria-disabled="true"]');
    expect(item).toBeInTheDocument();
    expect(item.tagName).not.toBe('A');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders Industries We Serve as a real link to its own page', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'Industries We Serve' })
    ).toHaveAttribute('href', '/industries');
  });

  it('renders View All Products as a standalone top-level link', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'View All Products →' })
    ).toHaveAttribute('href', '/search');
  });

  it('shows a loading state in the bar while categories load', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows an error state in the bar when categories fail to load', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Navbar />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders every top-level category as a real, always-visible link', () => {
    useCatalogTree.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', children: [] },
        { id: 7, name: 'Stretch Wrap', children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    expect(screen.getByRole('link', { name: 'EDGE PROTECTION' })).toHaveAttribute(
      'href',
      '/category/edge-protection'
    );
    expect(screen.getByRole('link', { name: 'Stretch Wrap' })).toHaveAttribute(
      'href',
      '/category/stretch-wrap'
    );
  });

  it('does not render a chevron dropdown for a category with no children', () => {
    useCatalogTree.mockReturnValue({
      data: [{ id: 7, name: 'Stretch Wrap', children: [] }],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);
    expect(
      screen.queryByRole('button', { name: 'Stretch Wrap submenu' })
    ).not.toBeInTheDocument();
  });

  it(
    "opens only one category's own children in its chevron dropdown, not every category's",
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [
              { id: 24, name: 'Corner Board', children: [] },
              { id: 25, name: 'Strapping Protectors', children: [] },
            ],
          },
          {
            id: 7,
            name: 'Stretch Wrap',
            children: [{ id: 30, name: 'Hand Wrap', children: [] }],
          },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));

      expect(await screen.findByRole('menuitem', { name: 'Corner Board' })).toHaveAttribute(
        'href',
        '/category/edge-protection/corner-board'
      );
      expect(screen.getByRole('menuitem', { name: 'Strapping Protectors' })).toHaveAttribute(
        'href',
        '/category/edge-protection/strapping-protectors'
      );
      expect(screen.queryByRole('menuitem', { name: 'Hand Wrap' })).not.toBeInTheDocument();
    }
  );

  it(
    'closes the first dropdown when a second category is opened',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          { id: 12, name: 'EDGE PROTECTION', children: [{ id: 24, name: 'Corner Board', children: [] }] },
          { id: 7, name: 'Stretch Wrap', children: [{ id: 30, name: 'Hand Wrap', children: [] }] },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));
      expect(await screen.findByRole('menuitem', { name: 'Corner Board' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Stretch Wrap submenu' }));
      expect(await screen.findByRole('menuitem', { name: 'Hand Wrap' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Corner Board' })).not.toBeInTheDocument();
    }
  );

  it(
    'renders a grandchild (3rd level) with the full canonical path inside the category dropdown',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [
              {
                id: 24,
                name: 'Corner Board',
                children: [{ id: 99, name: 'White Corner Board', children: [] }],
              },
            ],
          },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));

      expect(
        await screen.findByRole('menuitem', { name: 'White Corner Board' })
      ).toHaveAttribute('href', '/category/edge-protection/corner-board/white-corner-board');
    }
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/layout/Navbar.test.jsx`
Expected: FAIL — e.g. `getByRole('link', { name: 'Industries We Serve' })` finds an href of `/#industries` not `/industries`; `getByRole('button', { name: 'EDGE PROTECTION submenu' })` finds nothing (no such button exists in the current single-mega-menu implementation); `getByText('Loading categories…')` is not found in the bar itself (it's currently only reachable after clicking "Shop Products").

- [ ] **Step 3: Implement**

Replace the entire contents of `components/layout/Navbar.js` with:

```jsx
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/layout/Navbar.test.jsx`
Expected: PASS — all 12 cases green.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Navbar.js components/layout/Navbar.test.jsx
git commit -m "Navbar: every top-level category always visible, one dropdown per category"
```

---

## Task 2: HeroBanner — static banner, carousel mechanism removed

**Files:**
- Modify: `components/home/HeroBanner.js` (full rewrite below)
- Modify: `components/home/HeroBanner.test.jsx` (full rewrite below)

**Interfaces:**
- Produces: `HeroBanner()` — no props, unchanged external interface.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `components/home/HeroBanner.test.jsx` with:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBanner } from './HeroBanner';

describe('HeroBanner', () => {
  it('renders the static slide heading, subtitle, and CTA', () => {
    render(<HeroBanner />);
    expect(
      screen.getByRole('heading', {
        name: 'Industrial packaging supplies for every business',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Strapping, tools, stretch film and more, sourced and shipped in bulk.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Shop Products/ })).toHaveAttribute(
      'href',
      '/search'
    );
  });

  it('renders no slide-navigation controls', () => {
    render(<HeroBanner />);
    expect(screen.queryByRole('button', { name: /Go to slide/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/home/HeroBanner.test.jsx`
Expected: FAIL — the first test still passes (slide 1's content is already the first-rendered slide today), but is run here only as a baseline; the second test FAILs because the current implementation does render `"Go to slide 1"`/`"Go to slide 2"`/`"Go to slide 3"` buttons. (If your test runner reports the first test passing already, that's expected and fine — Step 4 confirms both pass together after the rewrite.)

- [ ] **Step 3: Implement**

Replace the entire contents of `components/home/HeroBanner.js` with:

```jsx
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const SLIDE = {
  image: '/hero-strapping.jpg',
  alt: 'Composite and woven strapping rolls with strapping tensioner tools',
  kicker: 'Industrial Packaging Supply',
  title: 'Industrial packaging supplies for every business',
  subtitle: 'Strapping, tools, stretch film and more, sourced and shipped in bulk.',
  cta: { label: 'Shop Products', href: '/search' },
};

export function HeroBanner() {
  return (
    <section aria-label="Featured highlights" className="relative overflow-hidden bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col sm:h-[600px] sm:flex-row">
        {/* Image panel: full-bleed on mobile, angled full-height panel on desktop */}
        <div className="relative h-64 w-full sm:absolute sm:inset-y-0 sm:right-0 sm:h-full sm:w-[58%] sm:[clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)]">
          <Image
            src={SLIDE.image}
            alt={SLIDE.alt}
            fill
            priority
            sizes="(min-width: 640px) 58vw, 100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink/25" />
        </div>

        {/* Text panel */}
        <div className="relative z-10 flex w-full flex-col justify-center px-6 py-10 sm:w-[46%] sm:px-10 sm:py-0 lg:px-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            {SLIDE.kicker}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {SLIDE.title}
          </h1>
          <p className="mt-5 max-w-sm text-sm text-on-ink-muted sm:text-base">
            {SLIDE.subtitle}
          </p>
          <Link
            href={SLIDE.cta.href}
            className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white"
          >
            <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-accent">
              {SLIDE.cta.label}
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/home/HeroBanner.test.jsx`
Expected: PASS — both cases green.

- [ ] **Step 5: Commit**

```bash
git add components/home/HeroBanner.js components/home/HeroBanner.test.jsx
git commit -m "HeroBanner: static banner, carousel mechanism removed"
```

---

## Task 3: Move Industries to its own page

**Files:**
- Create: `components/info/IndustriesView.js`
- Create: `components/info/IndustriesView.test.jsx`
- Create: `app/(storefront)/industries/page.js`
- Delete: `components/home/Industries.js`
- Delete: `components/home/Industries.test.jsx`

**Interfaces:**
- Produces: `IndustriesView()` — no props, same content/markup `Industries()` had, just renamed. Consumed by `app/(storefront)/industries/page.js` in this same task.

- [ ] **Step 1: Write the failing test**

Create `components/info/IndustriesView.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndustriesView } from './IndustriesView';

describe('IndustriesView', () => {
  it('renders all three industries linking to a real category', () => {
    render(<IndustriesView />);

    expect(
      screen.getByRole('link', { name: /Lumber, Doors & Building Materials/ })
    ).toHaveAttribute('href', '/category/cord-strapping');
    expect(
      screen.getByRole('link', { name: /Manufacturing & Metalworking/ })
    ).toHaveAttribute('href', '/category/lashing-equipment');
    expect(
      screen.getByRole('link', { name: /Warehousing, 3PL & Distribution/ })
    ).toHaveAttribute('href', '/category/stretch-film');
  });
});
```

Note: the old file's second test ("has the #industries anchor for the navbar link to target") is deliberately not carried over — its own stated reason (the navbar used to target this anchor) is no longer true now that the navbar links to `/industries` directly (Task 1). The anchor markup itself still exists in the component below (harmless, unused), but there is nothing left for a test to meaningfully pin about it.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/info/IndustriesView.test.jsx`
Expected: FAIL — `components/info/IndustriesView.js` doesn't exist yet (module not found).

- [ ] **Step 3: Implement**

Create `components/info/IndustriesView.js` with exactly the content currently in `components/home/Industries.js`, renaming the exported function from `Industries` to `IndustriesView`:

```jsx
import Image from 'next/image';
import Link from 'next/link';

const INDUSTRIES = [
  {
    name: 'Lumber, Doors & Building Materials',
    text: 'Secure long and heavy bundles with high-strength cord strapping, corner boards and application tools.',
    image: {
      src: '/industry-lumber.webp',
      alt: 'Lumber bundle secured with composite cord strapping and a wire buckle',
    },
    href: '/category/cord-strapping',
  },
  {
    name: 'Manufacturing & Metalworking',
    text: 'Strap, lash and protect machinery, metal products and demanding industrial loads.',
    image: {
      src: '/industry-manufacturing.webp',
      alt: 'Machine housings strapped to wooden crate bases with cord strapping and buckles',
    },
    href: '/category/lashing-equipment',
  },
  {
    name: 'Warehousing, 3PL & Distribution',
    text: 'Standardize pallet wrapping, load containment and replenishment across high-volume shipping operations.',
    image: {
      src: '/industry-warehousing.jpg',
      alt: 'Palletized boxes braced inside a shipping container',
    },
    href: '/category/stretch-film',
  },
];

export function IndustriesView() {
  return (
    <section id="industries" className="scroll-mt-20 bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
          Industries We Serve
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Packaging solutions built for the way your industry ships
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Link key={industry.name} href={industry.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={industry.image.src}
                  alt={industry.image.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-base font-bold text-white">{industry.name}</h3>
                  <p className="mt-1 text-xs text-white/70">{industry.text}</p>
                  <span className="mt-2 inline-block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Create `app/(storefront)/industries/page.js`:

```jsx
import { IndustriesView } from '@/components/info/IndustriesView';

export default function IndustriesPage() {
  return <IndustriesView />;
}
```

Delete the old files:

```bash
git rm components/home/Industries.js components/home/Industries.test.jsx
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/info/IndustriesView.test.jsx`
Expected: PASS.

- [ ] **Step 5: Confirm nothing still imports the old path**

Run: `grep -rn "components/home/Industries" --include="*.js" --include="*.jsx" .`
Expected: no matches (the old file is deleted; Task 6 removes the homepage's own import of it in a later commit on this same branch — if this grep is run before Task 6 lands, a match in `app/(storefront)/page.js` is expected and will be resolved there, not a failure of this step).

- [ ] **Step 6: Commit**

```bash
git add components/info/IndustriesView.js components/info/IndustriesView.test.jsx app/\(storefront\)/industries/page.js
git commit -m "Move Industries to its own page at /industries"
```

---

## Task 4: Move QuoteSection to its own page

**Files:**
- Create: `components/info/QuoteView.js`
- Create: `components/info/QuoteView.test.jsx`
- Create: `app/(storefront)/quote/page.js`
- Delete: `components/home/QuoteSection.js`
- Delete: `components/home/QuoteSection.test.jsx`

**Interfaces:**
- Produces: `QuoteView()` — no props, same content/behavior `QuoteSection()` had (including the mailto-submission logic), just renamed. Consumed by `app/(storefront)/quote/page.js` in this same task.

- [ ] **Step 1: Write the failing tests**

Create `components/info/QuoteView.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteView } from './QuoteView';

describe('QuoteView', () => {
  it('shows validation errors for empty required fields', async () => {
    render(<QuoteView />);
    await userEvent.click(screen.getByRole('button', { name: 'Send Quote Request' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Company is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();
  });

  it('renders real, clickable contact details', () => {
    render(<QuoteView />);
    expect(screen.getByRole('link', { name: /469-992-2447/ })).toHaveAttribute(
      'href',
      'tel:+14699922447'
    );
    expect(
      screen.getByRole('link', { name: /sales@eskpackaging.com/ })
    ).toHaveAttribute('href', 'mailto:sales@eskpackaging.com');
    expect(
      screen.getByText('2050 Forest Ln #350, Garland, TX 75042')
    ).toBeInTheDocument();
  });

  it('opens a pre-filled mailto link on successful submit', async () => {
    render(<QuoteView />);

    await userEvent.type(screen.getByLabelText('Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Company'), 'Acme Co');
    await userEvent.type(
      screen.getByLabelText('What do you need quoted?'),
      '500 rolls of stretch film'
    );

    const assign = vi.fn();
    delete window.location;
    window.location = { assign };

    await userEvent.click(screen.getByRole('button', { name: 'Send Quote Request' }));

    expect(assign).toHaveBeenCalledTimes(1);
    const url = assign.mock.calls[0][0];
    expect(url).toMatch(/^mailto:sales@eskpackaging\.com\?subject=/);
    expect(url).toContain(encodeURIComponent('Acme Co'));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/info/QuoteView.test.jsx`
Expected: FAIL — `components/info/QuoteView.js` doesn't exist yet (module not found).

- [ ] **Step 3: Implement**

Create `components/info/QuoteView.js` with exactly the content currently in `components/home/QuoteSection.js`, renaming the exported function from `QuoteSection` to `QuoteView`:

```jsx
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
    <section id="quote" className="scroll-mt-20 bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 border-t border-border px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Request a Quote
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Tell us what you need quoted
          </h2>
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
    </section>
  );
}
```

Create `app/(storefront)/quote/page.js`:

```jsx
import { QuoteView } from '@/components/info/QuoteView';

export default function QuotePage() {
  return <QuoteView />;
}
```

Delete the old files:

```bash
git rm components/home/QuoteSection.js components/home/QuoteSection.test.jsx
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/info/QuoteView.test.jsx`
Expected: PASS — all 3 cases green.

- [ ] **Step 5: Confirm nothing still imports the old path**

Run: `grep -rn "components/home/QuoteSection" --include="*.js" --include="*.jsx" .`
Expected: no matches (the old file is deleted; Task 6 removes the homepage's own import of it in a later commit on this same branch — a match there before Task 6 lands is expected and resolved there, not a failure of this step).

- [ ] **Step 6: Commit**

```bash
git add components/info/QuoteView.js components/info/QuoteView.test.jsx app/\(storefront\)/quote/page.js
git commit -m "Move QuoteSection to its own page at /quote"
```

---

## Task 5: ProductGuidance's CTA points at /quote

**Files:**
- Modify: `components/home/ProductGuidance.js:65-67`
- Modify: `components/home/ProductGuidance.test.jsx:19-24`

**Interfaces:**
- Consumes: `/quote` route (Task 4).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing test**

In `components/home/ProductGuidance.test.jsx`, replace the test `'links the CTA to the quote section'` with:

```jsx
  it('links the CTA to the quote page', () => {
    render(<ProductGuidance />);
    expect(
      screen.getByRole('link', { name: /Get Product Guidance/ })
    ).toHaveAttribute('href', '/quote');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/home/ProductGuidance.test.jsx`
Expected: FAIL — the link's current `href` is `/#quote`, not `/quote`.

- [ ] **Step 3: Implement**

In `components/home/ProductGuidance.js`, change:

```jsx
          <Link
            href="/#quote"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-text-primary"
          >
```

to:

```jsx
          <Link
            href="/quote"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-text-primary"
          >
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/home/ProductGuidance.test.jsx`
Expected: PASS — both cases (the unchanged heading/items test plus the updated link test) green.

- [ ] **Step 5: Commit**

```bash
git add components/home/ProductGuidance.js components/home/ProductGuidance.test.jsx
git commit -m "ProductGuidance: point the quote CTA at /quote instead of /#quote"
```

---

## Task 6: Homepage drops the three moved sections

**Files:**
- Modify: `app/(storefront)/page.js`
- Create: `app/(storefront)/page.test.jsx`

**Interfaces:**
- Consumes: nothing new — this task only removes imports/renders of components Tasks 3 and 4 relocated.
- Produces: nothing new for later tasks — this is the plan's last task.

- [ ] **Step 1: Write the failing test**

Create `app/(storefront)/page.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';
import HomePage from './page';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

// FeaturedProducts fetches its own data via react-query's useQuery directly
// (no QueryClientProvider wraps this test), so it must be mocked the same
// way components/home/FeaturedProducts.test.jsx already mocks it - this
// test only cares which top-level sections render, not FeaturedProducts'
// own internals, hence the empty-array fixture (its own "no featured
// products" case, already covered by that file).
vi.mock('@/hooks/useFeaturedProducts', () => ({
  useFeaturedProducts: vi.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    useFeaturedProducts.mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  it('renders HeroBanner, the category section, and FeaturedProducts', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: 'Shop by category' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Industrial packaging supplies for every business',
      })
    ).toBeInTheDocument();
  });

  it('does not render Product Guidance, Industries, or the Quote form', () => {
    render(<HomePage />);
    expect(
      screen.queryByRole('heading', { name: 'Get the right packaging for your application' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Packaging solutions built for the way your industry ships' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send Quote Request' })
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/\(storefront\)/page.test.jsx`
Expected: FAIL on the second test — `ProductGuidance`'s heading, `Industries`' (soon `IndustriesView`'s) heading, and the Quote form's submit button are all still rendered by the current homepage.

- [ ] **Step 3: Implement**

Replace the entire contents of `app/(storefront)/page.js` with:

```jsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';

export default function HomePage() {
  return (
    <main>
      <HeroBanner />

      <section id="categories" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Full Product Range
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
              Shop by category
            </h2>
          </div>
          <Link
            href="/search"
            className="group mb-1 inline-flex items-center gap-2 text-sm font-semibold text-text-primary"
          >
            <span className="border-b border-accent pb-0.5 transition-colors group-hover:text-primary">
              View All Products
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
        <div className="mt-10">
          <CategoryShowcase />
        </div>
      </section>

      <FeaturedProducts />
    </main>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/\(storefront\)/page.test.jsx`
Expected: PASS — both cases green.

- [ ] **Step 5: Confirm the old moved-component paths are gone from the whole repo**

Run: `grep -rn "components/home/Industries\|components/home/QuoteSection" --include="*.js" --include="*.jsx" .`
Expected: no matches anywhere.

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — no regression in any other file.

- [ ] **Step 7: Commit**

```bash
git add app/\(storefront\)/page.js app/\(storefront\)/page.test.jsx
git commit -m "Homepage: drop Product Guidance, Industries, and Quote sections (moved to their own pages)"
```

---
