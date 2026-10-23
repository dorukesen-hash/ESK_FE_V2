# Storefront catalog_node foundation (Part 1/4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ESK_FE_V2's fixed-depth category/subcategory routing and data layer with one driven by ESK_API's unlimited-depth `catalog_node` tree, fixing the variant-URL-collision and Turkish-slug bugs along the way, with no visual redesign (that's Parts 2-4).

**Architecture:** One new hook (`useCatalogTree`) replaces three catalog-shaped hooks; one new pure module (`lib/catalogNodeTree.js`) provides tree lookups by id/slug; one new component (`CatalogNodeView`) and one catch-all route (`category/[...path]`) replace the fixed 2-level category/subcategory views and routes. Every other consumer (`Navbar`, `SearchFilters`, `SearchView`, `ProductView`, `useFeaturedProducts`, `CategoryShowcase`) is updated in place to read from the new hook instead of the old one.

**Tech Stack:** Next.js 16 App Router (client-side data fetching only, no server-side fetching anywhere in this codebase), TanStack Query v5, Vitest + React Testing Library + `@testing-library/user-event` (this repo already has a full test suite under this stack — `npm test` runs `vitest run` — contrary to this plan's spec, which incorrectly assumed no test framework existed; see the note below).

**Spec:** `docs/superpowers/specs/2026-10-23-storefront-catalog-node-foundation.md` (amended twice during planning: once to make `SearchFilters` stay 2-level instead of going recursive, since `GET /search` wasn't migrated to `nodeId`; the Testing section there still says "Node's built-in `node:test`" — that was wrong, this repo already has Vitest fully set up with dozens of existing `*.test.jsx` files, and every task below follows that existing convention instead).

**Companion fix already shipped:** While grounding this plan, a real production bug was found and fixed separately: `GET /search`'s `categoryId`/`subcategoryId` filters were matching catalog_node ids against the legacy `variant.category_id`/`subcategory_id` columns (a different id sequence), so every filtered search silently returned wrong/empty results. Fixed in ESK_API PR #45 (merged into `main`) to filter on `variant.nodeId` via the node's descendant subtree instead — verified against the real DB. This is why Task 7 below can safely keep sending `categoryId`/`subcategoryId` as catalog_node ids without any further backend change.

## Global Constraints

- Scope is data layer, routing, and breadcrumb only. No visual redesign of the mega menu, category grid, filter sidebar, or product page (Parts 2-4, later rounds).
- Every new/modified test uses Vitest (`describe`/`it`/`expect`/`vi` from `'vitest'`), not `node:test` — follow the exact patterns already in this repo (see `hooks/useCategories.test.jsx`, `components/catalog/CategoryView.test.jsx` for the established mocking style before this plan touches them).
- `lib/catalogNodeTree.js` (new, ESK_FE_V2) is plain ESM (`export function foo() {}`), matching every existing file in `lib/` (`slugify.js`, `cdn.js`, `refreshQueue.js`) — NOT the CommonJS `module.exports` pattern used in the same-named modules in ESK_API/ESK_ADMIN (those used CommonJS only because they're tested with Node's `node:test`, which doesn't apply here).
- No true server-side 301 redirect for non-canonical URLs — client-side `router.replace()` only, since this codebase fetches all data client-side and introducing server-side fetching is out of scope.
- `catalog_node.name` is globally unique (ESK_API-enforced, 409 on collision) — a slug computed from a name is therefore effectively unique too, so resolving a URL by its *last* path segment alone is sufficient; no ancestor-chain validation is needed for correctness.
- `SearchFilters.js`/`SearchView.js` keep today's 2-level filter UI shape and keep emitting `categoryId`/`subcategoryId` query params exactly as today — `/search` accepts any catalog_node id now (post ESK_API PR #45) and filters its full descendant subtree, but the FE doesn't expose selecting anything deeper than today's 2 levels this round.
- `hooks/useSearch.js` and `hooks/useVariantsByIds.js` are untouched — their hrefs are built from the variant's own title/row data (`slugify(variant.title)` / `slugify(row.title)`), not from a borrowed ancestor slug, so they're unaffected by both bugs this plan fixes, and they automatically benefit from Task 1's Turkish-transliteration fix since they import the same `slugify`.
- `hooks/useVariantSiblings.js` is untouched entirely.

## Review Focus

- A root node with no children and no variants (a genuinely empty leaf) must render a clear empty state, not a blank page — covered by a test in Task 4.
- A URL with fewer path segments than the resolved node's real depth (a stale bookmark, a hand-typed short link straight to a deep node) must still resolve via last-segment lookup and then redirect to the full canonical path — covered by a test in Task 4.
- A variant with `nodeId: null` (not yet migrated, or a data edge case) must render without crashing, with no broken breadcrumb links — covered by a test in Task 5.
- A node name that slugifies to an all-separator/empty string doesn't crash `findNodeBySlug`/`canonicalPath` — not independently tested; `slugify` always returns a string (possibly empty) and `findNodeBySlug` only does string equality, so there's no code path that could throw on it.
- Two nodes whose different names collide on the same slug (the spec's documented accepted limitation) resolve deterministically (first depth-first match) rather than being unspecified — already covered by a test in Task 2.

---

## Task 1: Fix `lib/slugify.js` for Turkish transliteration

**Files:**
- Modify: `lib/slugify.js`
- Test: `lib/slugify.test.js` (existing file — add new cases, keep the 3 existing ones)

**Interfaces:**
- Produces: `slugify(value: string): string` — same signature as today, used by every task below and by the untouched `useSearch.js`/`useVariantsByIds.js`.

- [ ] **Step 1: Add the failing tests**

Add to the existing `lib/slugify.test.js` (keep the existing 3 `it` blocks in the `describe('slugify', ...)` block, add these two after them):

```js
  it('transliterates Turkish characters instead of stripping them', () => {
    expect(slugify('Alüminyum Folyo')).toBe('aluminyum-folyo');
  });

  it('transliterates every mapped Turkish character, including ASCII "I"', () => {
    expect(slugify('ÇĞİıÖŞÜI')).toBe('cgiiosui');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- slugify`
Expected: FAIL — `slugify('Alüminyum Folyo')` currently returns `'al-minyum-folyo'` (the `ü` is stripped as a non-ASCII separator, not transliterated), not `'aluminyum-folyo'`.

- [ ] **Step 3: Implement the Turkish transliteration map**

Replace the full contents of `lib/slugify.js`:

```js
const TURKISH_MAP = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
};

export function slugify(value) {
  return value
    .split('')
    .map((ch) => TURKISH_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- slugify`
Expected: PASS — all 5 cases (3 existing + 2 new) green.

- [ ] **Step 5: Commit**

```bash
git add lib/slugify.js lib/slugify.test.js
git commit -m "Transliterate Turkish characters in slugify instead of stripping them"
```

---

## Task 2: New `lib/catalogNodeTree.js` pure helpers

**Files:**
- Create: `lib/catalogNodeTree.js`
- Test: `lib/catalogNodeTree.test.js`

**Interfaces:**
- Consumes: `slugify` from `./slugify` (Task 1).
- Produces: `findNode(tree, nodeId)`, `findAncestors(tree, nodeId)`, `findNodeBySlug(tree, slug)`, `canonicalPath(tree, nodeId)` — all pure, no I/O, operating on the raw tree shape `GET /catalog-node` returns: an array of root nodes, each `{ id, name, children: [...same shape], variants: [...], images: [...] }`. Used by Tasks 4, 5, 6, 7, 9.

- [ ] **Step 1: Write the failing tests**

Create `lib/catalogNodeTree.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { findNode, findAncestors, findNodeBySlug, canonicalPath } from './catalogNodeTree';

const tree = [
  {
    id: 1,
    name: 'Strapping & Load Securement',
    children: [
      {
        id: 2,
        name: 'Edge Protection',
        children: [{ id: 3, name: 'Corner Board', children: [] }],
      },
      { id: 4, name: 'Woven Strapping', children: [] },
    ],
  },
  { id: 5, name: 'Mailers', children: [] },
];

describe('findNode', () => {
  it('finds a root node', () => {
    expect(findNode(tree, 5)).toBe(tree[1]);
  });

  it('finds a node nested several levels deep', () => {
    expect(findNode(tree, 3)).toBe(tree[0].children[0].children[0]);
  });

  it('returns null for an unknown id', () => {
    expect(findNode(tree, 999)).toBeNull();
  });
});

describe('findAncestors', () => {
  it('returns an empty list for a root node', () => {
    expect(findAncestors(tree, 1)).toEqual([]);
  });

  it('returns ancestors root-first, excluding the node itself', () => {
    const ancestors = findAncestors(tree, 3);
    expect(ancestors.map((n) => n.id)).toEqual([1, 2]);
  });

  it('returns an empty list for an unknown id', () => {
    expect(findAncestors(tree, 999)).toEqual([]);
  });
});

describe('findNodeBySlug', () => {
  it('finds a node at any depth by its slugified name', () => {
    expect(findNodeBySlug(tree, 'corner-board')).toBe(tree[0].children[0].children[0]);
  });

  it('finds a root-level node', () => {
    expect(findNodeBySlug(tree, 'mailers')).toBe(tree[1]);
  });

  it('returns null when no node slugifies to the given slug', () => {
    expect(findNodeBySlug(tree, 'nonexistent')).toBeNull();
  });

  it('picks the first depth-first match when two different names collide on the same slug', () => {
    const collidingTree = [
      { id: 10, name: 'Ambalaj-Malzemeleri', children: [] },
      { id: 11, name: 'Ambalaj Malzemeleri', children: [] },
    ];
    expect(findNodeBySlug(collidingTree, 'ambalaj-malzemeleri').id).toBe(10);
  });
});

describe('canonicalPath', () => {
  it('returns a single slug for a root node', () => {
    expect(canonicalPath(tree, 5)).toEqual(['mailers']);
  });

  it('returns the full slug chain from root to a deeply nested node', () => {
    expect(canonicalPath(tree, 3)).toEqual([
      'strapping-load-securement',
      'edge-protection',
      'corner-board',
    ]);
  });

  it('returns an empty list for an unknown id', () => {
    expect(canonicalPath(tree, 999)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- catalogNodeTree`
Expected: FAIL with "Failed to resolve import `./catalogNodeTree`" (the module doesn't exist yet).

- [ ] **Step 3: Implement the module**

Create `lib/catalogNodeTree.js`:

```js
import { slugify } from './slugify';

export function findNode(tree, nodeId) {
  for (const node of tree) {
    if (node.id === nodeId) return node;
    const found = findNode(node.children ?? [], nodeId);
    if (found) return found;
  }
  return null;
}

export function findAncestors(tree, nodeId) {
  function search(nodes, trail) {
    for (const node of nodes) {
      if (node.id === nodeId) return trail;
      const found = search(node.children ?? [], [...trail, node]);
      if (found) return found;
    }
    return null;
  }
  return search(tree, []) ?? [];
}

export function findNodeBySlug(tree, slug) {
  for (const node of tree) {
    if (slugify(node.name) === slug) return node;
    const found = findNodeBySlug(node.children ?? [], slug);
    if (found) return found;
  }
  return null;
}

export function canonicalPath(tree, nodeId) {
  const node = findNode(tree, nodeId);
  if (!node) return [];
  return [...findAncestors(tree, nodeId), node].map((n) => slugify(n.name));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- catalogNodeTree`
Expected: PASS — all 11 cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/catalogNodeTree.js lib/catalogNodeTree.test.js
git commit -m "Add pure catalog_node tree helpers: findNode, findAncestors, findNodeBySlug, canonicalPath"
```

---

## Task 3: New `hooks/useCatalogTree.js`

**Files:**
- Create: `hooks/useCatalogTree.js`
- Test: `hooks/useCatalogTree.test.jsx`

**Interfaces:**
- Consumes: `api` from `@/lib/api` (existing axios instance).
- Produces: `CATALOG_TREE_QUERY_KEY` (query key array, for cache sharing — used by Task 8), `fetchCatalogTree()` (async fetcher, used by Task 8), `useCatalogTree()` (the hook — returns the raw tree array as `data`, no `select` transform). Used by Tasks 4, 5, 6, 7, 9.

- [ ] **Step 1: Write the failing tests**

Create `hooks/useCatalogTree.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCatalogTree } from './useCatalogTree';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCatalogTree', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('fetches the catalog_node tree and returns it as-is', async () => {
    const tree = [{ id: 1, name: 'Boxes', children: [], variants: [], images: [] }];
    api.get.mockResolvedValue({ data: tree });

    const { result } = renderHook(() => useCatalogTree(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/catalog-node');
    expect(result.current.data).toEqual(tree);
  });

  it('exposes an error state when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useCatalogTree(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- useCatalogTree`
Expected: FAIL with "Failed to resolve import `./useCatalogTree`".

- [ ] **Step 3: Implement the hook**

Create `hooks/useCatalogTree.js`:

```js
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const CATALOG_TREE_QUERY_KEY = ['catalog-tree'];

export async function fetchCatalogTree() {
  const { data } = await api.get('/catalog-node');
  return data;
}

export function useCatalogTree() {
  return useQuery({
    queryKey: CATALOG_TREE_QUERY_KEY,
    queryFn: fetchCatalogTree,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- useCatalogTree`
Expected: PASS — both cases green.

- [ ] **Step 5: Commit**

```bash
git add hooks/useCatalogTree.js hooks/useCatalogTree.test.jsx
git commit -m "Add useCatalogTree hook fetching GET /catalog-node"
```

---

## Task 4: `CatalogNodeView.js` + catch-all route, deleting the fixed-depth views/routes/hooks

**Files:**
- Create: `components/catalog/CatalogNodeView.js`
- Create: `components/catalog/CatalogNodeView.test.jsx`
- Create: `app/(storefront)/category/[...path]/page.js`
- Delete: `app/(storefront)/category/[categorySlug]/page.js`
- Delete: `app/(storefront)/category/[categorySlug]/[subcategorySlug]/page.js` (and the now-empty `[subcategorySlug]` and `[categorySlug]` directories)
- Delete: `components/catalog/CategoryView.js`, `components/catalog/CategoryView.test.jsx`
- Delete: `components/catalog/SubcategoryView.js`, `components/catalog/SubcategoryView.test.jsx`
- Delete: `hooks/useCategoryDetail.js`, `hooks/useCategoryDetail.test.jsx`
- Delete: `hooks/useSubcategoryProducts.js`, `hooks/useSubcategoryProducts.test.jsx`

**Interfaces:**
- Consumes: `useCatalogTree` (Task 3), `findNodeBySlug`/`findAncestors`/`canonicalPath` (Task 2), `resolveImageUrl` (existing `lib/cdn.js`), `slugify` (Task 1), `Breadcrumbs`/`ProductCard` (existing, unchanged).
- Produces: `CatalogNodeView({ path: string[] })` — the component Task 9's `CategoryShowcase` links into and the catch-all route renders.

- [ ] **Step 1: Write the failing tests**

Create `components/catalog/CatalogNodeView.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { CatalogNodeView } from './CatalogNodeView';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

const tree = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    images: [],
    variants: [],
    children: [
      {
        id: 18,
        name: 'Composite Strapping',
        images: [{ image: { url: 'images/composite.jpg' } }],
        variants: [
          { id: 327, title: 'A', sku: 'CC40/2', one_four_units: '68.00', unit: 'Coils' },
        ],
        children: [],
      },
    ],
  },
];

describe('CatalogNodeView', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('shows a not-found message when the slug does not resolve', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['nonexistent']} />);
    expect(screen.getByText("We couldn't find that category.")).toBeInTheDocument();
  });

  it("renders child tiles linking to each child's canonical path", () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    expect(screen.getByRole('heading', { name: 'CORD STRAPPING' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Composite Strapping/ })
    ).toHaveAttribute('href', '/category/cord-strapping/composite-strapping');
  });

  it('renders a product card per variant on the resolved node', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^A/ })).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
  });

  it('redirects to the canonical path when the URL does not match it', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['old-slug', 'composite-strapping']} />);
    expect(replace).toHaveBeenCalledWith('/category/cord-strapping/composite-strapping');
  });

  it('does not redirect when the URL already matches the canonical path', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a "nothing here yet" message for a leaf node with no children or variants', () => {
    const emptyTree = [{ id: 1, name: 'Empty Node', images: [], variants: [], children: [] }];
    useCatalogTree.mockReturnValue({ data: emptyTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['empty-node']} />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('resolves a node from its last segment alone and redirects a short URL to the full canonical path', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['composite-strapping']} />);
    expect(replace).toHaveBeenCalledWith('/category/cord-strapping/composite-strapping');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- CatalogNodeView`
Expected: FAIL with "Failed to resolve import `./CatalogNodeView`".

- [ ] **Step 3: Implement `CatalogNodeView.js`**

Create `components/catalog/CatalogNodeView.js`:

```jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { findNodeBySlug, findAncestors, canonicalPath } from '@/lib/catalogNodeTree';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductCard } from './ProductCard';

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function toProductCard(variant, node) {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    price: variant.one_four_units ? Number(variant.one_four_units) : null,
    unit: variant.unit,
    image: nodeImage(node),
    href: `/product/${slugify(node.name)}/${variant.id}`,
  };
}

export function CatalogNodeView({ path }) {
  const router = useRouter();
  const { data: tree, isLoading, isError } = useCatalogTree();
  const slug = path[path.length - 1];
  const node = tree ? findNodeBySlug(tree, slug) : null;

  useEffect(() => {
    if (!tree || !node) return;
    const canonical = canonicalPath(tree, node.id);
    if (canonical.join('/') !== path.join('/')) {
      router.replace(`/category/${canonical.join('/')}`);
    }
  }, [tree, node, path, router]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg"
            />
          ))}
        </div>
      </main>
    );
  }

  if (isError || !tree || !node) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-text-muted">We couldn&apos;t find that category.</p>
        <Link href="/search" className="mt-2 inline-block text-primary hover:text-primary-hover">
          Browse all products
        </Link>
      </main>
    );
  }

  const ancestors = findAncestors(tree, node.id);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: `/category/${canonicalPath(tree, ancestor.id).join('/')}`,
    })),
    { label: node.name },
  ];

  const children = node.children ?? [];
  const variants = node.variants ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Breadcrumbs items={breadcrumbItems} />

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-accent">
        {ancestors[0]?.name ?? 'Category'}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        {node.name}
      </h1>

      {children.length > 0 && (
        <>
          <p className="mt-2 text-text-muted">
            {children.length} {children.length === 1 ? 'subcategory' : 'subcategories'}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${canonicalPath(tree, child.id).join('/')}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg">
                  {nodeImage(child) && (
                    <Image
                      src={nodeImage(child)}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-text-primary">
                  {child.name}
                </h3>
                <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
              </Link>
            ))}
          </div>
        </>
      )}

      {variants.length > 0 && (
        <>
          <p className="mt-10 text-text-muted">
            {variants.length} {variants.length === 1 ? 'product' : 'products'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {variants.map((variant) => (
              <ProductCard key={variant.id} product={toProductCard(variant, node)} />
            ))}
          </div>
        </>
      )}

      {children.length === 0 && variants.length === 0 && (
        <p className="mt-10 text-text-muted">Nothing here yet.</p>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Create the catch-all route**

Create `app/(storefront)/category/[...path]/page.js`:

```js
import { CatalogNodeView } from '@/components/catalog/CatalogNodeView';

export default async function CatalogNodePage({ params }) {
  const { path } = await params;
  return <CatalogNodeView path={path} />;
}
```

- [ ] **Step 5: Delete the fixed-depth routes, views, hooks, and their tests**

```bash
git rm app/\(storefront\)/category/\[categorySlug\]/\[subcategorySlug\]/page.js
git rm app/\(storefront\)/category/\[categorySlug\]/page.js
git rm components/catalog/CategoryView.js components/catalog/CategoryView.test.jsx
git rm components/catalog/SubcategoryView.js components/catalog/SubcategoryView.test.jsx
git rm hooks/useCategoryDetail.js hooks/useCategoryDetail.test.jsx
git rm hooks/useSubcategoryProducts.js hooks/useSubcategoryProducts.test.jsx
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- CatalogNodeView`
Expected: PASS — all 7 cases green.

- [ ] **Step 7: Commit**

```bash
git add components/catalog/CatalogNodeView.js components/catalog/CatalogNodeView.test.jsx "app/(storefront)/category/[...path]/page.js"
git commit -m "Replace fixed-depth category/subcategory views+routes with CatalogNodeView catch-all"
```

---

## Task 5: `useVariant.js` nodeId passthrough + `ProductView.js` breadcrumb/productSlug rewrite

**Files:**
- Modify: `hooks/useVariant.js`
- Modify: `hooks/useVariant.test.jsx`
- Modify: `components/catalog/ProductView.js`
- Modify: `components/catalog/ProductView.test.jsx`

**Interfaces:**
- Consumes: `useCatalogTree` (Task 3), `findNode`/`findAncestors`/`canonicalPath` (Task 2).
- Produces: `useVariant(id)`'s returned object now includes `nodeId`, used by `ProductView.js` and available for Parts 2-4.

- [ ] **Step 1: Write the failing test for `useVariant.js`'s nodeId passthrough**

In `hooks/useVariant.test.jsx`, add `nodeId: 18` to the mocked `api.get` response's `data` object, and add `nodeId: 18` to the expected `result.current.data` object in the `'shapes the raw variant...'` test (both go in the same existing test — the fixture and the assertion must match):

```jsx
    api.get.mockResolvedValue({
      data: {
        id: 327,
        title: 'Composite Strapping',
        sku: 'CC40/2',
        description: 'A strap.',
        unit: 'Coils',
        one_four_units: '68.00',
        five_nine_units: '66.00',
        ten_plus_units: null,
        pallet_pricing: '53.00',
        bullet_1: 'Strong',
        bullet_2: '',
        bullet_3: null,
        size: '1/2" x 3610\'',
        color: 'White',
        material_type: 'Polyester',
        break_strength: 530,
        break_strength_unit_of_measure: 'LB',
        variant_images: [{ image: { url: 'images/a.jpg' } }],
        nodeId: 18,
        categoryId: 9,
        subcategoryId: 18,
        productId: null,
      },
    });

    const { result } = renderHook(() => useVariant(327), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/variant/327');
    expect(result.current.data).toEqual({
      id: 327,
      title: 'Composite Strapping',
      sku: 'CC40/2',
      description: 'A strap.',
      unit: 'Coils',
      priceTiers: [
        { label: '1-4 units', price: 68 },
        { label: '5-9 units', price: 66 },
        { label: 'Full pallet', price: 53 },
      ],
      bullets: ['Strong'],
      specs: [
        { label: 'Size', value: '1/2" x 3610\'' },
        { label: 'Color', value: 'White' },
        { label: 'Material', value: 'Polyester' },
        { label: 'Sold as', value: 'Coils' },
        { label: 'Break strength', value: '530 LB' },
      ],
      images: ['https://cdn.eskpackaging.com/images/a.jpg'],
      nodeId: 18,
      categoryId: 9,
      subcategoryId: 18,
      productId: null,
    });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useVariant.test`
Expected: FAIL — actual `result.current.data` has no `nodeId` key, so `toEqual` fails on the extra expected key.

- [ ] **Step 3: Add the `nodeId` passthrough**

In `hooks/useVariant.js`, modify `toVariantDetail`:

```js
function toVariantDetail(variant) {
  const images = (variant.variant_images ?? [])
    .map((entry) => resolveImageUrl(entry.image?.url))
    .filter(Boolean);

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    description: variant.description ?? null,
    unit: variant.unit ?? null,
    priceTiers: extractPriceTiers(variant),
    bullets: extractBullets(variant),
    specs: extractSpecs(variant),
    images,
    nodeId: variant.nodeId ?? null,
    categoryId: variant.categoryId ?? null,
    subcategoryId: variant.subcategoryId ?? null,
    productId: variant.productId ?? null,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useVariant.test`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for `ProductView.js`**

Replace the full contents of `components/catalog/ProductView.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVariant } from '@/hooks/useVariant';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useVariantSiblings } from '@/hooks/useVariantSiblings';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { ProductView } from './ProductView';

vi.mock('@/hooks/useVariant', () => ({
  useVariant: vi.fn(),
}));
vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));
vi.mock('@/hooks/useVariantSiblings', () => ({
  useVariantSiblings: vi.fn(),
}));

const baseVariant = {
  id: 327,
  title: 'Composite Strapping',
  sku: 'CC40/2',
  description: 'A strap.',
  unit: 'Coils',
  priceTiers: [
    { label: '1-4 units', price: 68 },
    { label: 'Full pallet', price: 53 },
  ],
  bullets: ['Strong'],
  specs: [{ label: 'Color', value: 'White' }],
  images: ['https://cdn.example.com/a.jpg'],
  nodeId: 18,
  categoryId: 9,
  subcategoryId: 18,
  productId: null,
};

const tree = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    children: [{ id: 18, name: 'Composite Strapping', children: [] }],
  },
];

describe('ProductView', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
    useCatalogTree.mockReturnValue({ data: tree });
    useVariantSiblings.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  });

  it('shows a not-found message when the variant does not resolve', () => {
    useVariant.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);
    expect(screen.getByText("We couldn't find that product.")).toBeInTheDocument();
  });

  it('renders title, SKU, price tiers, and a breadcrumb built from the catalog tree', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('$68.00')).toBeInTheDocument();
    expect(screen.getByText('$53.00')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'CORD STRAPPING' })
    ).toHaveAttribute('href', '/category/cord-strapping');
    expect(
      screen.getByRole('link', { name: 'Composite Strapping' })
    ).toHaveAttribute('href', '/category/cord-strapping/composite-strapping');
  });

  it('adds the chosen quantity to the cart and opens the cart drawer', async () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    const quantityInput = screen.getByLabelText('Quantity');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 3, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('adds as a pallet line when the pallet checkbox is checked', async () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    render(<ProductView variantId="327" />);

    await userEvent.click(screen.getByLabelText('Order by full pallet'));
    await userEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 1, isPallet: true },
    ]);
  });

  it('renders the variant options table wired to the current variant id', () => {
    useVariant.mockReturnValue({ data: baseVariant, isLoading: false, isError: false });
    useVariantSiblings.mockReturnValue({
      data: {
        count: 1,
        level: 'subcategory',
        levelName: 'Composite Strapping',
        rows: [
          {
            id: 327,
            title: 'Composite Strapping',
            sku: 'CC40/2',
            priceTiers: [{ label: '1-4 units', price: 68 }],
            palletPrice: 53,
            unitsPerPallet: 10,
            specValues: { size: null, color: 'White', material_type: null, style: null, unit: null, quantity_case: null, units_per_pallet: null, break_strength: null, core_diameter: null },
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<ProductView variantId="327" />);

    expect(useVariantSiblings).toHaveBeenCalledWith(327, { all: false });
    expect(screen.getByRole('heading', { name: 'Available Options' })).toBeInTheDocument();
  });

  it('renders without a breadcrumb category link when the variant has no nodeId', () => {
    useVariant.mockReturnValue({
      data: { ...baseVariant, nodeId: null },
      isLoading: false,
      isError: false,
    });
    render(<ProductView variantId="327" />);
    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'CORD STRAPPING' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test -- ProductView.test`
Expected: FAIL — the component still imports `useCategories`, which isn't mocked here, so the breadcrumb links aren't built the new way and the new/changed assertions fail.

- [ ] **Step 7: Rewrite `ProductView.js`'s breadcrumb logic**

In `components/catalog/ProductView.js`, replace the imports and `useBreadcrumbNames` helper:

```jsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useVariant } from '@/hooks/useVariant';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { findNode, findAncestors, canonicalPath } from '@/lib/catalogNodeTree';
import { Breadcrumbs } from './Breadcrumbs';
import { QuantityInput } from './QuantityInput';
import { VariantsTable } from './VariantsTable';

function useBreadcrumbNodes(tree, nodeId) {
  return useMemo(() => {
    if (!tree || nodeId == null) return { node: null, ancestors: [] };
    const node = findNode(tree, nodeId);
    if (!node) return { node: null, ancestors: [] };
    return { node, ancestors: findAncestors(tree, nodeId) };
  }, [tree, nodeId]);
}
```

Then replace the body of `ProductView` from the `useVariant`/breadcrumb lines through the `breadcrumbItems` construction:

```jsx
export function ProductView({ variantId }) {
  const numericId = Number(variantId);
  const { data: variant, isLoading, isError } = useVariant(numericId);
  const { data: tree } = useCatalogTree();
  const { node, ancestors } = useBreadcrumbNodes(tree, variant?.nodeId);
  const [quantity, setQuantity] = useState(1);
  const [isPallet, setIsPallet] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);
```

(leave the `isLoading`/`isError` early returns, `handleAddToCart`, and `hasPalletPrice` exactly as they are), then replace the breadcrumb construction:

```jsx
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: `/category/${canonicalPath(tree, ancestor.id).join('/')}`,
    })),
    ...(node
      ? [{ label: node.name, href: `/category/${canonicalPath(tree, node.id).join('/')}` }]
      : []),
    { label: variant.title },
  ];
```

and the category label line just above the `<h1>`:

```jsx
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            {ancestors[0]?.name ?? node?.name ?? 'Product'}
          </p>
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test -- ProductView.test`
Expected: PASS — all 6 cases green.

- [ ] **Step 9: Commit**

```bash
git add hooks/useVariant.js hooks/useVariant.test.jsx components/catalog/ProductView.js components/catalog/ProductView.test.jsx
git commit -m "ProductView: build breadcrumb from the catalog tree via variant.nodeId"
```

---

## Task 6: `Navbar.js` recursive mega menu

**Files:**
- Modify: `components/layout/Navbar.js`
- Modify: `components/layout/Navbar.test.jsx`

**Interfaces:**
- Consumes: `useCatalogTree` (Task 3), `canonicalPath` (Task 2).

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `components/layout/Navbar.test.jsx`:

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
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about-us');
  });

  it('renders Knowledge Center as a disabled, non-navigating item', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);

    const item = screen.getByText('Knowledge Center').closest('[aria-disabled="true"]');
    expect(item).toBeInTheDocument();
    expect(item.tagName).not.toBe('A');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders Industries We Serve as a real link to the homepage section', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'Industries We Serve' })
    ).toHaveAttribute('href', '/#industries');
  });

  it(
    'shows a loading state inside the mega menu',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));
      expect(await screen.findByText('Loading categories…')).toBeInTheDocument();
    }
  );

  it(
    'shows an error state inside the mega menu',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));
      expect(await screen.findByText('Categories unavailable.')).toBeInTheDocument();
    }
  );

  it(
    'renders each node with its children and a View All Products link',
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
          { id: 7, name: 'Stretch Wrap', children: [] },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));

      expect(
        await screen.findByRole('menuitem', { name: 'EDGE PROTECTION' })
      ).toHaveAttribute('href', '/category/edge-protection');
      expect(
        screen.getByRole('menuitem', { name: 'Corner Board' })
      ).toHaveAttribute('href', '/category/edge-protection/corner-board');
      expect(
        screen.getByRole('menuitem', { name: 'Strapping Protectors' })
      ).toHaveAttribute('href', '/category/edge-protection/strapping-protectors');
      expect(
        screen.getByRole('menuitem', { name: 'Stretch Wrap' })
      ).toHaveAttribute('href', '/category/stretch-wrap');
      expect(
        screen.getByRole('menuitem', { name: 'View All Products →' })
      ).toHaveAttribute('href', '/search');
    }
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- Navbar.test`
Expected: FAIL with "Failed to resolve import `@/hooks/useCatalogTree`" style errors (component still imports `useCategories`, which this test file no longer mocks).

- [ ] **Step 3: Rewrite `Navbar.js`**

Replace the full contents of `components/layout/Navbar.js`:

```jsx
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- Navbar.test`
Expected: PASS — all 6 cases green.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Navbar.js components/layout/Navbar.test.jsx
git commit -m "Navbar: recursive mega menu over the catalog tree instead of a hard-coded 2 levels"
```

---

## Task 7: `SearchFilters.js` + `SearchView.js` — swap data source, keep the 2-level UI

**Files:**
- Modify: `components/catalog/SearchFilters.js`
- Modify: `components/catalog/SearchFilters.test.jsx`
- Modify: `components/catalog/SearchView.js`
- Modify: `components/catalog/SearchView.test.jsx`

**Interfaces:**
- Consumes: `useCatalogTree` (Task 3). `useSearch` (existing, untouched) and its `categoryId`/`subcategoryId` params are unchanged in meaning: they're catalog_node ids, which `/search` (ESK_API PR #45, already merged) now correctly resolves via descendant subtree.

- [ ] **Step 1: Write the failing tests for `SearchFilters.js`**

Replace the full contents of `components/catalog/SearchFilters.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { SearchFilters } from './SearchFilters';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

const treeFixture = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    children: [
      { id: 18, name: 'Composite Strapping', children: [] },
      { id: 16, name: 'Woven Strapping', children: [] },
    ],
  },
  { id: 12, name: 'MAILERS', children: [] },
];

function renderFilters(props = {}) {
  return render(
    <SearchFilters
      categoryId={undefined}
      subcategoryId={undefined}
      onSelectCategory={vi.fn()}
      onSelectSubcategory={vi.fn()}
      onClear={vi.fn()}
      {...props}
    />
  );
}

describe('SearchFilters', () => {
  beforeEach(() => {
    useCatalogTree.mockReturnValue({ data: treeFixture, isLoading: false, isError: false });
  });

  it('lists every top-level node and keeps children collapsed by default', () => {
    renderFilters();
    expect(screen.getByRole('button', { name: 'CORD STRAPPING' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MAILERS' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Composite Strapping' })).not.toBeInTheDocument();
  });

  it('expands a node to show its children on chevron click', async () => {
    renderFilters();
    await userEvent.click(screen.getByRole('button', { name: 'Expand CORD STRAPPING' }));
    expect(screen.getByRole('button', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Woven Strapping' })).toBeInTheDocument();
  });

  it('auto-expands the node holding the active child', () => {
    renderFilters({ categoryId: 9, subcategoryId: 18 });
    expect(screen.getByRole('button', { name: 'Composite Strapping' })).toBeInTheDocument();
  });

  it('calls onSelectCategory with the node id when a top-level name is clicked', async () => {
    const onSelectCategory = vi.fn();
    renderFilters({ onSelectCategory });
    await userEvent.click(screen.getByRole('button', { name: 'MAILERS' }));
    expect(onSelectCategory).toHaveBeenCalledWith(12);
  });

  it('calls onSelectSubcategory with the parent node id and child id', async () => {
    const onSelectSubcategory = vi.fn();
    renderFilters({ categoryId: 9, onSelectSubcategory });
    await userEvent.click(screen.getByRole('button', { name: 'Woven Strapping' }));
    expect(onSelectSubcategory).toHaveBeenCalledWith(9, 16);
  });

  it('only shows Clear filters when a filter is active', () => {
    const { rerender } = renderFilters();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    rerender(
      <SearchFilters
        categoryId={9}
        subcategoryId={undefined}
        onSelectCategory={vi.fn()}
        onSelectSubcategory={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('calls onClear when Clear filters is clicked', async () => {
    const onClear = vi.fn();
    renderFilters({ categoryId: 9, onClear });
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- SearchFilters.test`
Expected: FAIL (component still imports `useCategories`, not mocked in this test file anymore).

- [ ] **Step 3: Rewrite `SearchFilters.js`**

Replace the full contents of `components/catalog/SearchFilters.js`:

```jsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCatalogTree } from '@/hooks/useCatalogTree';

function CategoryGroup({
  node,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
}) {
  const children = node.children ?? [];
  const isActiveCategory = selectedCategoryId === node.id && !selectedSubcategoryId;
  const hasActiveSubcategory = children.some((child) => child.id === selectedSubcategoryId);
  const [open, setOpen] = useState(isActiveCategory || hasActiveSubcategory);
  const hasChildren = children.length > 0;

  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectCategory(node.id)}
          className={`flex-1 text-left text-sm font-bold uppercase tracking-wide transition-colors ${
            isActiveCategory || hasActiveSubcategory
              ? 'text-primary'
              : 'text-text-primary hover:text-primary'
          }`}
        >
          {node.name}
        </button>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-text-muted transition-colors hover:text-primary"
          >
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {open && hasChildren && (
        <ul className="mt-2 space-y-1.5 border-l-2 border-accent-tint-strong pl-3">
          {children.map((child) => {
            const active = selectedSubcategoryId === child.id;
            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onSelectSubcategory(node.id, child.id)}
                  className={`block w-full py-0.5 text-left text-sm transition-colors ${
                    active ? 'font-semibold text-primary' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  {child.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SearchFilters({
  categoryId,
  subcategoryId,
  onSelectCategory,
  onSelectSubcategory,
  onClear,
}) {
  const { data: tree, isLoading, isError } = useCatalogTree();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasActiveFilter = Boolean(categoryId || subcategoryId);

  return (
    <aside className="lg:w-60 lg:shrink-0">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Filters</p>
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover lg:hidden"
        >
          {mobileOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className={`${mobileOpen ? 'mt-4 block' : 'hidden'} lg:mt-4 lg:block`}>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClear}
            className="mb-3 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Clear filters
          </button>
        )}
        {isLoading && <p className="text-sm text-text-muted">Loading filters…</p>}
        {isError && <p className="text-sm text-text-muted">Filters unavailable.</p>}
        {tree?.map((node) => (
          <CategoryGroup
            key={node.id}
            node={node}
            selectedCategoryId={categoryId}
            selectedSubcategoryId={subcategoryId}
            onSelectCategory={onSelectCategory}
            onSelectSubcategory={onSelectSubcategory}
          />
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- SearchFilters.test`
Expected: PASS — all 7 cases green.

- [ ] **Step 5: Write the failing tests for `SearchView.js`**

In `components/catalog/SearchView.test.jsx`, replace the `useCategories` mock and fixture with `useCatalogTree`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearch } from '@/hooks/useSearch';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { SearchView } from './SearchView';

const push = vi.fn();
let searchParamsValue = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock('@/hooks/useSearch', () => ({
  useSearch: vi.fn(),
}));

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

const treeFixture = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    children: [{ id: 18, name: 'Composite Strapping', children: [] }],
  },
  { id: 12, name: 'MAILERS', children: [] },
];

describe('SearchView', () => {
  beforeEach(() => {
    push.mockClear();
    searchParamsValue = '';
    useCatalogTree.mockReturnValue({
      data: treeFixture,
      isLoading: false,
      isError: false,
    });
  });
```

(keep every existing `it(...)` block below that `beforeEach` exactly as-is — none of them reference `useCategories` or `categoriesFixture` by name elsewhere in the file, they only use `useSearch`'s mocked return value and the URL params).

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test -- SearchView.test`
Expected: FAIL (component still imports `useCategories`, not mocked in this test file anymore).

- [ ] **Step 7: Update `SearchView.js`**

In `components/catalog/SearchView.js`, replace the import and the two lines deriving `activeCategory`/`activeSubcategory`:

```jsx
import { useCatalogTree } from '@/hooks/useCatalogTree';
```

```jsx
  const { data: tree } = useCatalogTree();

  const activeCategory = tree?.find((node) => node.id === categoryId);
  const activeSubcategory = activeCategory?.children?.find(
    (child) => child.id === subcategoryId
  );
```

(leave everything else in the file — `buildSearchUrl`, `SearchResultRow`, all the handlers, the JSX — exactly as it is).

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test -- SearchView.test`
Expected: PASS — all 10 cases green.

- [ ] **Step 9: Commit**

```bash
git add components/catalog/SearchFilters.js components/catalog/SearchFilters.test.jsx components/catalog/SearchView.js components/catalog/SearchView.test.jsx
git commit -m "SearchFilters/SearchView: read from the catalog tree, keep the 2-level filter UI"
```

---

## Task 8: `useFeaturedProducts.js` recursive walk

**Files:**
- Modify: `hooks/useFeaturedProducts.js`
- Modify: `hooks/useFeaturedProducts.test.jsx`

**Interfaces:**
- Consumes: `CATALOG_TREE_QUERY_KEY`/`fetchCatalogTree` (Task 3, for cache-sharing with `useCatalogTree`), `resolveImageUrl` (existing), `slugify` (Task 1).

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `hooks/useFeaturedProducts.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFeaturedProducts } from './useFeaturedProducts';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFeaturedProducts', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.get.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('collects featured variants attached directly to a node, ordered by position', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          images: [],
          variants: [],
          children: [
            {
              id: 18,
              name: 'Composite Strapping',
              images: [{ image: { url: 'images/composite.jpg' } }],
              variants: [
                { id: 329, title: 'B', sku: 'CC60/2', featured: true, featured_position: 1, one_four_units: '60.00', unit: 'Coils' },
                { id: 327, title: 'A', sku: 'CC40/2', featured: true, featured_position: 0, one_four_units: '68.00', unit: 'Coils' },
                { id: 999, title: 'Not featured', featured: false },
              ],
              children: [],
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/catalog-node');
    expect(result.current.data).toEqual([
      {
        id: 327,
        title: 'A',
        sku: 'CC40/2',
        price: 68,
        unit: 'Coils',
        position: 0,
        image: 'https://cdn.eskpackaging.com/images/composite.jpg',
        href: '/product/composite-strapping/327',
      },
      {
        id: 329,
        title: 'B',
        sku: 'CC60/2',
        price: 60,
        unit: 'Coils',
        position: 1,
        image: 'https://cdn.eskpackaging.com/images/composite.jpg',
        href: '/product/composite-strapping/329',
      },
    ]);
  });

  it('collects featured variants nested several levels deep, using the image/slug of the node the variant is attached to', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'BOXES',
          images: [{ image: { url: 'images/sub.jpg' } }],
          variants: [],
          children: [
            {
              id: 31,
              name: 'Corrugated Boxes',
              images: [{ image: { url: 'images/sub.jpg' } }],
              variants: [],
              children: [
                {
                  id: 4,
                  name: 'RSC Boxes',
                  images: [{ image: { url: 'images/product.jpg' } }],
                  variants: [
                    { id: 642, title: '4x4x4', sku: 'BX-4x4x4', featured: true, one_four_units: '1.20', unit: 'Each' },
                  ],
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: 642,
        title: '4x4x4',
        sku: 'BX-4x4x4',
        price: 1.2,
        unit: 'Each',
        position: 0,
        image: 'https://cdn.eskpackaging.com/images/product.jpg',
        href: '/product/rsc-boxes/642',
      },
    ]);
  });

  it('returns an empty list when nothing is featured', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'BOXES',
          images: [],
          variants: [],
          children: [{ id: 31, name: 'Corrugated Boxes', images: [], variants: [], children: [] }],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('caps the result at 8 even when more variants are marked featured', async () => {
    const variants = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `Variant ${i + 1}`,
      sku: `SKU-${i + 1}`,
      featured: true,
      featured_position: i,
      one_four_units: '10.00',
      unit: 'Each',
    }));
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'BOXES',
          images: [],
          variants: [],
          children: [{ id: 31, name: 'Corrugated Boxes', images: [], variants, children: [] }],
        },
      ],
    });

    const { result } = renderHook(() => useFeaturedProducts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(8);
    expect(result.current.data.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- useFeaturedProducts.test`
Expected: FAIL — `api.get` is asserted to have been called with `/catalog-node`, but the current implementation still calls `/category` (via the old `fetchCatalog`), and the fixture shape (`children`/`variants`/`images`) doesn't match what the old `collectFeaturedProducts` expects (`subcategories`/`products`).

- [ ] **Step 3: Rewrite `useFeaturedProducts.js`**

Replace the full contents of `hooks/useFeaturedProducts.js`:

```js
'use client';

import { useQuery } from '@tanstack/react-query';
import { CATALOG_TREE_QUERY_KEY, fetchCatalogTree } from '@/hooks/useCatalogTree';
import { resolveImageUrl } from '@/lib/cdn';
import { slugify } from '@/lib/slugify';

// Homepage curation is admin-driven and open-ended - cap how many render
// here so the section can't grow into an unbounded page-length list if
// someone marks many variants featured.
const FEATURED_LIMIT = 8;

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

function toFeaturedProduct(variant, node) {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? null,
    price: variant.one_four_units ? Number(variant.one_four_units) : null,
    unit: variant.unit,
    position: variant.featured_position ?? 0,
    image: nodeImage(node),
    href: `/product/${slugify(node.name)}/${variant.id}`,
  };
}

function collectFeaturedProducts(tree) {
  const featured = [];

  function walk(nodes) {
    for (const node of nodes) {
      for (const variant of node.variants ?? []) {
        if (variant.featured) {
          featured.push(toFeaturedProduct(variant, node));
        }
      }
      walk(node.children ?? []);
    }
  }
  walk(tree);

  return featured.sort((a, b) => a.position - b.position).slice(0, FEATURED_LIMIT);
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: CATALOG_TREE_QUERY_KEY,
    queryFn: fetchCatalogTree,
    select: collectFeaturedProducts,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- useFeaturedProducts.test`
Expected: PASS — all 4 cases green.

- [ ] **Step 5: Commit**

```bash
git add hooks/useFeaturedProducts.js hooks/useFeaturedProducts.test.jsx
git commit -m "useFeaturedProducts: recursive walk over the catalog tree, no depth limit"
```

---

## Task 9: `CategoryShowcase.js` data-source swap

**Files:**
- Modify: `components/home/CategoryShowcase.js`
- Modify: `components/home/CategoryShowcase.test.jsx`

**Interfaces:**
- Consumes: `useCatalogTree` (Task 3), `canonicalPath` (Task 2), `resolveImageUrl` (existing).

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `components/home/CategoryShowcase.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { CategoryShowcase } from './CategoryShowcase';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

function makeNodes(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Category ${i + 1}`,
    images: [],
    children: [],
  }));
}

function tileFor(categoryName) {
  return screen.getByRole('link', { name: new RegExp(categoryName) });
}

describe('CategoryShowcase', () => {
  it('renders an empty state when there are no categories', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(screen.getByText('No categories available yet.')).toBeInTheDocument();
  });

  it('never spans the feature tile when there are too few categories to fill its rows', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(4), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 1').className).not.toContain('row-span-2');
  });

  it('spans the feature tile once there are enough categories to fill its rows', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(5), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 1').className).toContain('row-span-2');
  });

  it('does not span the sixth tile wide unless two more categories follow it', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(7), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 6').className).not.toContain('col-span-2');
  });

  it('spans the sixth tile wide once the grid is fully packed', () => {
    useCatalogTree.mockReturnValue({ data: makeNodes(8), isLoading: false, isError: false });
    render(<CategoryShowcase />);
    expect(tileFor('Category 6').className).toContain('col-span-2');
  });

  it('renders skeleton placeholders while loading', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<CategoryShowcase />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);
  });

  it('shows an error message when the request fails', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<CategoryShowcase />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders a card per category linking to its canonical path', () => {
    useCatalogTree.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', images: [{ image: { url: 'images/a.jpg' } }], children: [] },
        { id: 7, name: 'Boxes', images: [], children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);

    expect(screen.getByRole('link', { name: /EDGE PROTECTION/ })).toHaveAttribute(
      'href',
      '/category/edge-protection'
    );
    expect(screen.getByRole('link', { name: /Boxes/ })).toHaveAttribute(
      'href',
      '/category/boxes'
    );
  });

  it('numbers each tile starting from 01', () => {
    useCatalogTree.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', images: [], children: [] },
        { id: 7, name: 'Boxes', images: [], children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<CategoryShowcase />);

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- CategoryShowcase.test`
Expected: FAIL (component still imports `useCategories`, not mocked in this test file anymore).

- [ ] **Step 3: Rewrite `CategoryShowcase.js`**

Replace the full contents of `components/home/CategoryShowcase.js`:

```jsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { resolveImageUrl } from '@/lib/cdn';
import { canonicalPath } from '@/lib/catalogNodeTree';

// Asymmetric bento rhythm instead of a uniform grid: the first tile is a
// large 2x2 feature block, the sixth spans two columns, the rest are
// standard squares. Both spans are gated on having enough remaining tiles
// to fully fill the row/rows they reserve.
const FEATURE_MIN_COUNT = 5;
const WIDE_MIN_COUNT = 8;

function getSpanClass(index, total) {
  if (index === 0 && total >= FEATURE_MIN_COUNT) {
    return 'sm:col-span-2 sm:row-span-2';
  }
  if (index === 5 && total >= WIDE_MIN_COUNT) {
    return 'sm:col-span-2';
  }
  return '';
}

function nodeImage(node) {
  const url = node.images?.[0]?.image?.url;
  return url ? resolveImageUrl(url) : null;
}

// Root nodes never had their own image in the legacy data model - borrow
// the first child's image, same fallback the old useCategories hook did
// for categories via their subcategories.
function tileImage(node) {
  return nodeImage(node) || (node.children ?? []).map(nodeImage).find(Boolean) || null;
}

function CategoryTile({ tree, node, index, total }) {
  const image = tileImage(node);

  return (
    <Link
      href={`/category/${canonicalPath(tree, node.id).join('/')}`}
      className={`group flex flex-col ${getSpanClass(index, total)}`}
    >
      <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-button-secondary-bg sm:aspect-auto">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute -bottom-6 -left-6 h-16 w-16 rotate-45 bg-ink" />
        <span className="absolute bottom-2 left-2 text-xs font-bold text-accent">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-text-primary">
        {node.name}
      </h3>
      <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
    </Link>
  );
}

export function CategoryShowcase() {
  const { data: tree, isLoading, isError } = useCatalogTree();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-lg bg-button-secondary-bg"
          />
        ))}
      </div>
    );
  }

  if (isError || !tree) {
    return <p className="text-sm text-text-muted">Categories unavailable.</p>;
  }

  if (tree.length === 0) {
    return <p className="text-sm text-text-muted">No categories available yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:auto-rows-[180px] sm:[grid-auto-flow:dense]">
      {tree.map((node, index) => (
        <CategoryTile key={node.id} tree={tree} node={node} index={index} total={tree.length} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- CategoryShowcase.test`
Expected: PASS — all 9 cases green.

- [ ] **Step 5: Commit**

```bash
git add components/home/CategoryShowcase.js components/home/CategoryShowcase.test.jsx
git commit -m "CategoryShowcase: read from the catalog tree instead of useCategories"
```

---

## Task 10: Delete `useCategories.js`, full build + manual verification

**Files:**
- Delete: `hooks/useCategories.js`, `hooks/useCategories.test.jsx`

**Interfaces:**
- Consumes: nothing — this task only removes the now-unused hook and verifies the whole branch.

- [ ] **Step 1: Confirm nothing still imports the old hook**

Run: `grep -rn "useCategories\|CATALOG_QUERY_KEY\|fetchCatalog\b" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=.next`
Expected: no matches outside `hooks/useCategories.js` and `hooks/useCategories.test.jsx` themselves.

- [ ] **Step 2: Delete the hook and its test**

```bash
git rm hooks/useCategories.js hooks/useCategories.test.jsx
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — every test file in the repo green, including every file this plan touched or left untouched.

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: Build succeeds with no route-conflict or missing-import errors (the deleted `[categorySlug]`/`[subcategorySlug]` routes are gone, the new `[...path]` catch-all is the only route under `category/`).

- [ ] **Step 5: Manual verification pass in the browser**

Run: `npm run dev`, then in a browser check:
- Home page: mega menu opens and lists real categories/subcategories (Navbar), the category showcase grid renders with working links, the featured products section renders.
- A real 2-segment category URL (e.g. `/category/strapping-load-securement/cord-strapping`) renders the product grid.
- A real 1-segment URL for a node that is actually nested deeper (if the real catalog has one) redirects to its full canonical path.
- `/search` with no query, then with a category filter and a subcategory filter selected, shows correct result counts (this exercises the already-merged ESK_API PR #45 fix end-to-end).
- A product detail page shows a correct multi-level breadcrumb.

- [ ] **Step 6: Commit**

```bash
git add hooks/useCategories.js hooks/useCategories.test.jsx
git commit -m "Remove useCategories: fully replaced by useCatalogTree"
```

---
