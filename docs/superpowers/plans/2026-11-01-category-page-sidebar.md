# Category Page Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the category page a persistent left sidebar showing the current node's top-level department's full category tree, so a shopper browsing deep inside a department can jump sideways to a sibling category without backing out to the nav bar.

**Architecture:** A new, self-contained `components/catalog/CategorySidebar.js` recursively renders a department's subtree (the same visual pattern as `Navbar.js`'s `NavNode`, not shared code), highlighting the current node as a non-link span. `CatalogNodeView.js`'s `<main>` gains a two-column grid below the breadcrumb - sidebar in a `lg`-only first column, the existing category content (unchanged) in the second.

**Tech Stack:** Next.js, Tailwind, Vitest + React Testing Library (matching `components/catalog/CatalogNodeView.test.jsx`'s existing conventions).

**Spec:** `docs/superpowers/specs/2026-11-01-category-page-sidebar.md`

## Global Constraints

- The sidebar always renders the current node's top-level department's FULL subtree, never a partial/local slice: `department = ancestors.length > 0 ? ancestors[0] : node` (where `node` is the page's own resolved node and `ancestors = findAncestors(tree, node.id)`, already computed by `CatalogNodeView.js` for its breadcrumb).
- No collapse/expand interaction - the whole subtree renders fully expanded, always.
- The sidebar column is `hidden lg:block` - dropped entirely on mobile.
- No attribute/spec filtering is added anywhere on this page or in the sidebar.
- The existing subcategory grid's markup/breakpoints and `VariantsTable` are unchanged.

## Review Focus

- The sidebar renders a link for every node in the department's subtree, including the current node's own direct children - the same names the existing subcategory grid in the main content area already renders as links. A test that queries a child category's link by name alone (`getByRole('link', { name: ... })`, not scoped to a specific container) now matches two elements and throws. This is a real, immediate regression in two of this file's existing tests, not a hypothetical - both must be fixed to scope their query to the main content column specifically, not just happen to still pass.
- Visiting a top-level department's own page directly (the node has no ancestors) must still render a correct, non-empty sidebar - `department` resolves to the node itself in that case, not to `undefined` or an empty tree.
- A degenerate single-node department (no siblings, no children anywhere) must render the sidebar as one highlighted line without throwing - `node.children` can be `[]` at every level.
- The current node must be highlighted correctly no matter how deep it is in the subtree (depth 0, the department root itself; depth 1, a direct child; depth 2+, a grandchild) - not just at the shallowest case a lazy test might check.
- Real-browser verification of the `lg:top-32` sticky offset is a standing, already-acknowledged gap inherited from Part 4's product-page sticky column (no browser tool in this implementation session) - this plan does not attempt to close it, and no task should claim to.

---

## Task 1: `CategorySidebar` component

**Files:**
- Create: `components/catalog/CategorySidebar.js`
- Create: `components/catalog/CategorySidebar.test.jsx`

**Interfaces:**
- Produces: `CategorySidebar({ tree, department, currentNodeId })` - a React component. `tree` is the full catalog tree (same shape `useCatalogTree()` returns, needed for `canonicalPath`); `department` is the single root node whose subtree to render; `currentNodeId` is the id of the node to highlight (may be `department.id` itself, or any descendant's id, at any depth). Consumed by Task 2.

- [ ] **Step 1: Write the failing tests**

Create `components/catalog/CategorySidebar.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CategorySidebar } from './CategorySidebar';

const tree = [
  {
    id: 1,
    name: 'STRAPPING & LOAD SECUREMENT',
    children: [
      {
        id: 2,
        name: 'Cord Strapping',
        children: [
          { id: 4, name: 'Composite Strapping', children: [] },
          { id: 5, name: 'PET Strapping', children: [] },
        ],
      },
      { id: 3, name: 'Lashing Equipment', children: [] },
    ],
  },
  {
    id: 10,
    name: 'EDGE PROTECTION',
    children: [{ id: 11, name: 'Corner Board', children: [] }],
  },
];

const department = tree[0];

describe('CategorySidebar', () => {
  it("renders every node in the department's subtree as a link, except the current node", () => {
    render(<CategorySidebar tree={tree} department={department} currentNodeId={2} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByRole('link', { name: 'Lashing Equipment' })).toHaveAttribute(
      'href',
      '/category/strapping-load-securement/lashing-equipment'
    );
    expect(
      within(nav).getByRole('link', { name: 'Composite Strapping' })
    ).toHaveAttribute('href', '/category/strapping-load-securement/cord-strapping/composite-strapping');
    expect(within(nav).getByRole('link', { name: 'PET Strapping' })).toBeInTheDocument();

    expect(within(nav).queryByRole('link', { name: 'Cord Strapping' })).not.toBeInTheDocument();
    expect(within(nav).getByText('Cord Strapping')).toHaveAttribute('aria-current', 'page');
  });

  it('does not render any node from a different top-level department', () => {
    render(<CategorySidebar tree={tree} department={department} currentNodeId={2} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).queryByText('EDGE PROTECTION')).not.toBeInTheDocument();
    expect(within(nav).queryByText('Corner Board')).not.toBeInTheDocument();
  });

  it('highlights the current node correctly at any depth, including a grandchild', () => {
    render(<CategorySidebar tree={tree} department={department} currentNodeId={4} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByText('Composite Strapping')).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Cord Strapping' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'PET Strapping' })).toBeInTheDocument();
  });

  it('highlights the department root itself when it is the current node', () => {
    render(<CategorySidebar tree={tree} department={department} currentNodeId={1} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByText('STRAPPING & LOAD SECUREMENT')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: 'Cord Strapping' })).toBeInTheDocument();
  });

  it('renders a department with no children at all as a single highlighted line, without throwing', () => {
    const lonelyDepartment = { id: 20, name: 'Solo Department', children: [] };
    expect(() =>
      render(
        <CategorySidebar
          tree={[lonelyDepartment]}
          department={lonelyDepartment}
          currentNodeId={20}
        />
      )
    ).not.toThrow();

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByText('Solo Department')).toHaveAttribute('aria-current', 'page');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/CategorySidebar.test.jsx`
Expected: FAIL - `components/catalog/CategorySidebar.js` doesn't exist yet (module not found).

- [ ] **Step 3: Implement**

Create `components/catalog/CategorySidebar.js`:

```jsx
import Link from 'next/link';
import { canonicalPath } from '@/lib/catalogNodeTree';

// Same visual pattern as Navbar.js's NavNode (bold uppercase at the
// department-root depth, plain text deeper, each nested level indented
// under a left border) - a deliberately separate component, not shared
// code, since a persistent page sidebar and a nav-bar dropdown are
// different enough contexts that forcing one shared renderer would
// couple them for no real benefit.
function SidebarNode({ tree, node, currentNodeId, depth }) {
  const isCurrent = node.id === currentNodeId;
  const children = node.children ?? [];

  return (
    <li>
      {isCurrent ? (
        <span aria-current="page" className="block text-sm font-semibold text-primary">
          {node.name}
        </span>
      ) : (
        <Link
          href={`/category/${canonicalPath(tree, node.id).join('/')}`}
          className={
            depth === 0
              ? 'block text-sm font-bold uppercase tracking-wide text-text-primary transition-colors hover:text-primary'
              : 'block text-sm text-text-muted transition-colors hover:text-primary'
          }
        >
          {node.name}
        </Link>
      )}
      {children.length > 0 && (
        <ul className="mt-1.5 space-y-1.5 border-l border-border pl-3">
          {children.map((child) => (
            <SidebarNode
              key={child.id}
              tree={tree}
              node={child}
              currentNodeId={currentNodeId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategorySidebar({ tree, department, currentNodeId }) {
  return (
    <nav aria-label="Category" className="lg:sticky lg:top-32 lg:self-start">
      <ul>
        <SidebarNode tree={tree} node={department} currentNodeId={currentNodeId} depth={0} />
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/CategorySidebar.test.jsx`
Expected: PASS - all 5 cases green.

- [ ] **Step 5: Commit**

```bash
git add components/catalog/CategorySidebar.js components/catalog/CategorySidebar.test.jsx
git commit -m "Add CategorySidebar: full department tree, current node highlighted"
```

---

## Task 2: Wire `CategorySidebar` into `CatalogNodeView`

**Files:**
- Modify: `components/catalog/CatalogNodeView.js`
- Modify: `components/catalog/CatalogNodeView.test.jsx`

**Interfaces:**
- Consumes: `CategorySidebar({ tree, department, currentNodeId })` (Task 1).
- Produces: nothing new for later tasks - this is the plan's last task.

- [ ] **Step 1: Write the failing tests**

In `components/catalog/CatalogNodeView.test.jsx`, add the import:

```js
import { within } from '@testing-library/react';
```

(Add `within` to the existing `import { render, screen } from '@testing-library/react';` line rather than a separate import statement.)

Fix the two existing tests that collide with the sidebar's own links (both currently query a child category's link name without scoping to the main content area - once the sidebar also renders a link with that same name, an unscoped `getByRole` matches two elements and throws). Replace the test `"renders child tiles linking to each child's canonical path"` with:

```jsx
  it("renders child tiles linking to each child's canonical path", () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    expect(screen.getByRole('heading', { name: 'CORD STRAPPING' })).toBeInTheDocument();
    const main = screen.getByTestId('category-main');
    expect(
      within(main).getByRole('link', { name: /Composite Strapping/ })
    ).toHaveAttribute('href', '/category/cord-strapping/composite-strapping');
  });
```

Replace the test `"renders both child tiles and a buyable table when a node has children and variants at once"` with:

```jsx
  it('renders both child tiles and a buyable table when a node has children and variants at once', () => {
    const mixedTree = [
      {
        id: 9,
        name: 'CORD STRAPPING',
        images: [],
        variants: [{ id: 500, title: 'Loose variant', sku: 'LV1', one_four_units: '10.00', unit: 'Each' }],
        children: [
          { id: 18, name: 'Composite Strapping', images: [], variants: [], children: [] },
        ],
      },
    ];
    useCatalogTree.mockReturnValue({ data: mixedTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    const main = screen.getByTestId('category-main');
    expect(within(main).getByRole('link', { name: /Composite Strapping/ })).toBeInTheDocument();
    expect(within(main).getAllByRole('link', { name: /^Loose variant/ }).length).toBeGreaterThan(0);
  });
```

Add three new test cases at the end of the `describe` block, before the closing `});`:

```jsx
  it('renders the sidebar scoped to the current department, with the current node highlighted', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    const sidebar = screen.getByRole('navigation', { name: 'Category' });
    expect(within(sidebar).getByText('Composite Strapping')).toHaveAttribute('aria-current', 'page');
    // The department root (CORD STRAPPING) is Composite Strapping's parent,
    // not the current node itself here, so it renders as a link.
    expect(within(sidebar).getByRole('link', { name: 'CORD STRAPPING' })).toBeInTheDocument();
  });

  it('renders a correct, non-empty sidebar when visiting a top-level department directly (no ancestors)', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    const sidebar = screen.getByRole('navigation', { name: 'Category' });
    expect(within(sidebar).getByText('CORD STRAPPING')).toHaveAttribute('aria-current', 'page');
    expect(within(sidebar).getByRole('link', { name: /Composite Strapping/ })).toBeInTheDocument();
  });

  it('does not throw and still renders a sidebar for a leaf node with no children or variants', () => {
    const emptyTree = [{ id: 1, name: 'Empty Node', images: [], variants: [], children: [] }];
    useCatalogTree.mockReturnValue({ data: emptyTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['empty-node']} />);

    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    const sidebar = screen.getByRole('navigation', { name: 'Category' });
    expect(within(sidebar).getByText('Empty Node')).toHaveAttribute('aria-current', 'page');
  });
```

Note: the second new test case above (`'CORD STRAPPING'` highlighted when visiting it directly) will fail against the *current* file content, since `getByTestId('category-main')` doesn't exist yet either - that's expected, both are part of this same RED step.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/catalog/CatalogNodeView.test.jsx`
Expected: FAIL - `getByTestId('category-main')` finds nothing (the main content column doesn't have that test id yet), and `getByRole('navigation', { name: 'Category' })` finds nothing (the sidebar isn't rendered yet).

- [ ] **Step 3: Implement**

In `components/catalog/CatalogNodeView.js`, add the import:

```js
import { CategorySidebar } from './CategorySidebar';
```

Immediately after the existing line `const ancestors = findAncestors(tree, node.id);`, add:

```js
  const department = ancestors.length > 0 ? ancestors[0] : node;
```

Replace the returned JSX's body - from `<Breadcrumbs items={breadcrumbItems} />` through the end of the three conditional blocks (children grid / variants table / empty message), currently all siblings directly inside `<main>` - with:

```jsx
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <CategorySidebar tree={tree} department={department} currentNodeId={node.id} />
        </div>

        <div data-testid="category-main">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
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
                {children.map((child) => {
                  const image = nodeImage(child);
                  const productCount = countDescendantVariants(child);
                  return (
                    <Link
                      key={child.id}
                      href={`/category/${canonicalPath(tree, child.id).join('/')}`}
                      className="group flex flex-col"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-button-secondary-bg">
                        {image && (
                          <Image
                            src={image}
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
                      <p className="text-xs text-text-muted">
                        {productCount} {productCount === 1 ? 'product' : 'products'}
                      </p>
                      <span className="mt-1 block h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-8" />
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {variants.length > 0 && (
            <>
              <p className="mt-10 text-text-muted">
                {variants.length} {variants.length === 1 ? 'product' : 'products'}
              </p>
              <div className="mt-4">
                <VariantsTable
                  variants={variants}
                  productSlug={slugify(node.name) || String(node.id)}
                  displayFields={node.displayFields}
                />
              </div>
            </>
          )}

          {children.length === 0 && variants.length === 0 && (
            <p className="mt-10 text-text-muted">Nothing here yet.</p>
          )}
        </div>
      </div>
```

This is purely a restructuring wrap - the category label, `<h1>`, subcategory grid, and `VariantsTable` blocks are byte-identical to what they replace, just now nested one level deeper (inside the new two-column grid's second column) instead of being direct children of `<main>`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run components/catalog/CatalogNodeView.test.jsx`
Expected: PASS - all cases (the pre-existing ones plus the 3 new ones) green.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS - no regression in any other file.

- [ ] **Step 6: Commit**

```bash
git add components/catalog/CatalogNodeView.js components/catalog/CatalogNodeView.test.jsx
git commit -m "Category page: add the department sidebar alongside the existing content"
```

---
