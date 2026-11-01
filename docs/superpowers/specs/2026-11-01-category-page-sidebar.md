# Category page sidebar (Part 3 of the uline.com-inspired redesign)

Date: 2026-11-01
Scope: `components/catalog/CatalogNodeView.js`; new `components/catalog/CategorySidebar.js`.

Part of the uline.com-inspired redesign initiative. Part 1 (catalog content/
theme), Part 4 (product page density), and Part 2 (nav + homepage) are
already shipped and merged to local `main`. This is the last remaining
part.

## Problem

The category page (`CatalogNodeView.js`) has no persistent left-side
navigation at all - just a breadcrumb, a subcategory image grid (for a
container node), and a `VariantsTable` (for a node with its own variants).
A shopper browsing deep inside one department (e.g. viewing "Cord
Strapping") has no way to jump sideways to a sibling category (e.g. "PET
Strapping", both children of "Strapping & Load Securement") without
backing out to the nav bar's dropdown. Part 2 made every top-level
department always visible in the nav bar, but that only solves *top-level*
discoverability - it does nothing for navigating within a department once
a shopper is inside it. uline.com's own category pages solve this with a
persistent left sidebar showing the current department's full category
tree.

## Decision

**New component, `CategorySidebar.js`:** a pure, presentational recursive
tree renderer - the same shape as `Navbar.js`'s existing `NavNode` (bold
uppercase label at the department-root depth, plain text at deeper
depths, each nested level indented under a left border), reused as a
visual pattern but not as shared code (this component owns its own
render, matching the established per-repo convention of not sharing
UI-tree renderers across unrelated contexts like the nav bar vs. a page
body). The current node renders as a non-link, highlighted
(`text-primary`, `aria-current="page"`) span instead of a `<Link>`;
every other node in the tree is a real link to its own category page.
No collapse/expand interaction - the whole department subtree renders
fully expanded always. This catalog's real depth is shallow (confirmed
during Part 1/2's own research: typically department → subcategory, with
category pages ("Edge Protection → Corner Board → White Corner Board")
being the deepest observed case at 3 levels) - a collapsible tree would
be solving a problem this catalog doesn't have.

**Which subtree:** `CatalogNodeView.js` already computes
`findAncestors(tree, node.id)` for the breadcrumb. The sidebar's root is
that chain's first ancestor (`ancestors[0]`) when the current node has
ancestors, or the current node itself when it has none (i.e. the current
page already *is* a top-level department) - either way, "the top-level
department the current node belongs to." The sidebar always renders that
whole department's subtree, with the current node highlighted wherever it
falls inside it - so visiting a leaf product-group three levels deep
still shows the department's full breadth (every sibling, at every
level), not just a local slice.

**Layout:** `CatalogNodeView.js`'s `<main>` gains a two-column structure
below the breadcrumb: `grid gap-8 lg:grid-cols-[240px_1fr]`, sidebar in
the first column (`hidden lg:block` - mobile drops it entirely, relying
on the breadcrumb and the nav bar, matching uline.com's own mobile
behavior), the existing category label/`<h1>`/subcategory grid/
`VariantsTable` unchanged in the second. The sidebar column is
`lg:sticky lg:top-32 lg:self-start`, the exact pattern already proven (and
already fixed through its own real issues - viewport clamping doesn't
apply here since there's no portal involved, just a plain sticky
column, but the `lg:top-32` offset estimate and its "spot-check in a real
browser" caveat both carry over identically) in Part 4's product-page buy
box. Squeezing the existing subcategory grid and `VariantsTable` into a
narrower column (1fr of a 240px-reduced row instead of the full
`max-w-6xl`) is an accepted, intentional density increase - both already
have their own responsive/overflow handling (`VariantsTable`'s own
`overflow-x-auto` wrapper; the subcategory grid's `sm:grid-cols-4` breakpoints
stay as they are, just rendering slightly denser cards - not broken,
just tighter, consistent with this app's existing "Minimalism" density
choice from Part 1).

**Unchanged:** the breadcrumb (stays above the two-column row, full
width), the subcategory grid's own markup/breakpoints, `VariantsTable`,
the loading/error/empty states (none of which need a sidebar - a category
that doesn't resolve has no tree to show one for).

## Testing

- `components/catalog/CategorySidebar.test.jsx` (new): renders the
  correct department subtree regardless of how deep the current node is
  (test with a node 2 levels deep inside a department, assert the
  department's *other* top-level sibling department does NOT appear, and
  every node in the correct department does); highlights the current node
  as a non-link `aria-current="page"` element while every other node in
  the tree is a real `<Link>` with the correct `canonicalPath`-derived
  href; renders a department with no further children without throwing
  (lone top-level department visit).
- `components/catalog/CatalogNodeView.test.jsx` (existing file, updated):
  asserts the sidebar renders with the correct department when visiting a
  nested category page; asserts the existing subcategory grid and
  `VariantsTable` assertions still pass inside the new two-column layout
  (no behavior change to either, so existing cases should need only
  wrapper/structural updates, not new assertions).

## Out of scope

- Attribute/spec filtering in the sidebar (or anywhere on this page) -
  confirmed directly with the user; `/search`'s own `SearchFilters` is
  untouched and this page gets no filtering mechanism of its own.
- Collapse/expand interaction for deep trees - this catalog's real depth
  doesn't need it (see Decision).
- Mobile sidebar presentation (e.g. a drawer or accordion) - dropped
  entirely below `lg`, relying on the breadcrumb and Part 2's always-visible
  nav bar.
- Any change to the breadcrumb, the subcategory grid's own markup, or
  `VariantsTable`.
- Precise pixel verification of `lg:top-32` in a real browser - the same
  standing, acknowledged gap from Part 4 (no browser tool in this session);
  not re-litigated here, just inherited.
