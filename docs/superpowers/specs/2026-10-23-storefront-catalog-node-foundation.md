# Storefront catalog_node foundation (Part 1 of the Uline-inspired redesign)

Date: 2026-10-23
Scope: ESK_FE_V2 data layer, routing, and breadcrumb only. Deliberately
NOT in scope: any visual redesign (mega menu layout, category sidebar,
product page density) — those are Parts 2-4 of a 4-part plan, each
with their own brainstorming/spec round. This part exists so Parts
2-4 have real, unlimited-depth, correctly-routed data to design
against; its own visible output is close to today's current look.

## Problem

ESK_FE_V2 still reads the catalog through `GET /category`, a
compatibility shim (see ESK_API's
`docs/superpowers/specs/2026-10-22-unlimited-catalog-hierarchy-design.md`)
that only represents trees up to 3 levels deep (Category →
Subcategory → Product). The real catalog now lives in `catalog_node`
(`GET /catalog-node`), which supports arbitrary depth — but nothing
in ESK_FE_V2 reads it yet. The storefront's own hard-coded 2-level
routing (`/category/[categorySlug]/[subcategorySlug]`) and components
(`CategoryView`, `SubcategoryView`) can't represent anything deeper
even if the data could.

Two further, previously-documented defects compound this:

- A variant attached directly to a subcategory (no Product in
  between) borrows the *subcategory's* slug as its "product slug" in
  `/product/[productSlug]/[variantId]` — two unrelated, legitimately
  different products in the same subcategory collide on the same URL
  path, differing only by `variantId`.
- `lib/slugify.js` strips Turkish diacritics (ğ, ş, ç, ö, ü, ı, İ) as
  if they were separators instead of transliterating them (e.g.
  "Alüminyum Folyo" → "al-minyum-folyo"). This was tolerable while
  slugs only needed to be unique among siblings; it stops being
  tolerable once slug lookup is global (see below).

## Decision

Replace the two fixed-depth category routes with one catch-all route,
resolved by a **single slug lookup against the whole tree**, made
safe by a property ESK_API now guarantees that didn't exist before
this redesign was proposed: **`catalog_node.name` is unique across
the entire catalog**, not just among siblings (enforced server-side,
409 on collision — see ESK_API's `catalogNodeController.js`). A slug
computed from a name is therefore effectively unique too (barring the
rare case documented below), so a URL's *last* path segment alone is
enough to find the right node anywhere in the tree — no need to
validate or even store the full ancestor chain for lookup purposes.
Leading segments exist for readability/SEO and are checked against
the canonical path, not relied on for correctness.

This mirrors the approach already built and shipped for ESK_ADMIN
(`lib/catalogNodeTree.js` there: `findNode`, `findAncestors`,
`flattenTreeForPicker`) — this spec ports the same pure-function
pattern to the public storefront, adding a slug-based lookup the
admin side didn't need (admin addresses nodes by numeric id in a
`?node=` query param; a public storefront needs human-readable,
indexable paths).

**Known, accepted limitation:** slug uniqueness is *not* separately
enforced — two different names that both collapse to the same slug
(e.g. "Ambalaj-Malzemeleri" and "Ambalaj Malzemeleri") would collide.
Given the real catalog's actual names (checked against the live
backfill: "Strapping & Load Securement", "Edge Protection", etc.),
this is a rare, theoretical edge case. First-match-wins in tree
traversal order if it ever happens; not engineered against further in
this round.

## Data layer

New `lib/catalogNodeTree.js` (pure functions, no I/O — same shape as
ESK_ADMIN's module of the same name, plus one new function):

- `findNode(tree, nodeId)` — ported as-is.
- `findAncestors(tree, nodeId)` — ported as-is; root-first, excludes
  the node itself.
- `findNodeBySlug(tree, slug)` — new. Depth-first search comparing
  `slugify(node.name) === slug`; returns the first match or `null`.
- `canonicalPath(tree, nodeId)` — new. `[...findAncestors(tree,
  nodeId), node].map(n => slugify(n.name))`, i.e. the full slug chain
  from root to this node, for building breadcrumbs and the canonical
  URL.

`lib/slugify.js` is fixed to transliterate Turkish characters instead
of stripping them:
```js
const TURKISH_MAP = { ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u' };

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
(Note: ASCII `I` is mapped to `i`, not the locale-correct dotless
`ı`→`i`/dotted `İ`→`i` distinction ESK_API's `toTitleCase` has to make
— a slug has no casing to preserve, so there is no dotted/dotless
ambiguity here the way there was for display-casing; both Turkish "I"
variants slug to plain "i" unambiguously.)

`hooks/useCategories.js`, `hooks/useCategoryDetail.js`, and
`hooks/useSubcategoryProducts.js` are replaced by one
`hooks/useCatalogTree.js`:
```js
export function useCatalogTree() {
  return useQuery({
    queryKey: ['catalog-tree'],
    queryFn: async () => {
      const { data } = await api.get('/catalog-node');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```
One bulk fetch, same access pattern the current code already uses for
the whole category/subcategory/product tree (and the same pattern
ESK_ADMIN uses) — the real catalog is small (48 nodes as of the live
backfill), so this is not a regression in payload size or request
count; if anything it replaces what was already effectively "fetch
the whole tree" with a lighter endpoint (`GET /catalog-node`'s
variant shape is `{id, title, sku, nodeId}`, trimmed — no price,
description, or image fields the category/listing pages don't use;
Parts 2-4 figure out, page by page, whether any of them actually need
the fuller `getFullTree` shape instead).

`hooks/useVariant.js` and `hooks/useVariantSiblings.js` are untouched
— they already address a variant/its siblings by numeric id via
`/variant/:id` and `/variant/:id/siblings`, neither of which this
redesign changes.

## Routing

`app/(storefront)/category/[categorySlug]/[subcategorySlug]/page.js`
and `.../category/[categorySlug]/page.js` are deleted, replaced by
`app/(storefront)/category/[...path]/page.js`. The page resolves
`params.path[params.path.length - 1]` (the last segment) via
`findNodeBySlug`; if nothing matches, it renders the existing
not-found UI (same as today's "we couldn't find that category").

**Backward compatible by construction:** every URL that worked today
still works — a 2-segment path like
`/category/ambalaj-malzemeleri/koli-bantlari` still resolves, because
the catch-all still receives those two segments and still looks up
the *last* one (`koli-bantlari`) by slug. No redirect migration, no
sitemap change, nothing indexed today breaks.

If the resolved node's real `canonicalPath` differs from the URL's
`params.path` (a stale bookmark, a manually-edited URL, or simply a
URL pointing at a non-leaf ancestor's old slug after a rename), the
page does a client-side `router.replace()` to the canonical path once
the tree has loaded. This is a pragmatic choice, not a true SSR 301:
the whole app already fetches its data client-side via TanStack
Query (there is no server-side data fetching anywhere in this
codebase today), and introducing one here would be a bigger
architectural change than this part's scope.

`app/(storefront)/product/[productSlug]/[variantId]/page.js` is
unchanged in shape — `productSlug` is still decorative (the variant
is addressed by `variantId`), but it is now **always** the real slug
of the node the variant is attached to (via `variant.nodeId`,
resolved with `findNode`), never a borrowed ancestor slug. This is
what eliminates the URL-collision defect: two different nodes now
always produce two different `productSlug` values, because node names
are globally unique.

## Breadcrumb

`components/catalog/Breadcrumbs.js` is unchanged (it already just
renders a list of `{label, href}` items). Every page that builds
breadcrumb items switches from manually walking
category→subcategory→product to `findAncestors(tree, node.id)`,
mapping each ancestor to `{label: ancestor.name, href:
'/category/' + canonicalPath(tree, ancestor.id).join('/')}` — correct
at any depth, no per-level special-casing.

## Components (minimal change — Parts 2-4 own the real redesign)

`CategoryView.js` and `SubcategoryView.js` collapse into one
`CatalogNodeView.js`: if the resolved node has `children.length > 0`,
render today's tile grid (currently `CategoryView`'s); if it has
`variants.length > 0`, render today's product-card grid (currently
`SubcategoryView`'s) — both can be true at once (a node can have
child nodes and variants simultaneously, exactly like `Category` can
today), in which case both sections render, stacked, matching how a
node with both is already representable. Visually this is
deliberately close to identical to today; the only functional
difference is it no longer assumes a fixed depth.

`components/layout/Navbar.js`'s mega menu and
`components/catalog/SearchFilters.js` both currently loop exactly 2
levels deep (`category.subcategories.map(...)`, hard-coded). Both
become a small recursive render (render a node's name + link, then
recurse into `node.children` one indentation/column level deeper).
Visually this still looks like today's nested list for the real
catalog's actual depth (3 levels); it simply stops being hard-capped
at 2.

## Testing

`lib/catalogNodeTree.test.js` and an extended `lib/slugify.test.js`,
using Node's built-in `node:test` (ESK_FE_V2 has no test framework
today, matching the "add nothing new" precedent set by both the
ESK_API and ESK_ADMIN rounds of this same initiative):

- `findNode`, `findAncestors` — same cases as ESK_ADMIN's existing
  suite for the identical functions (any-depth lookup, root has no
  ancestors, unknown id).
- `findNodeBySlug` — finds a node at any depth by its slug; returns
  `null` for no match; the documented same-slug-different-name
  collision picks the first depth-first match deterministically (a
  test pins this behavior rather than leaving it unspecified).
- `canonicalPath` — root returns `[rootSlug]`; a 3-deep node returns
  all 3 slugs in order.
- `slugify` — the existing ASCII cases plus Turkish transliteration
  ("Alüminyum Folyo" → "aluminyum-folyo", not "al-minyum-folyo").

Routing/component changes (Next.js page files, React components) have
no existing test convention in this repo either; verified manually
(`npm run dev`, exercising the site in a browser) per the plan's own
task instructions, consistent with how the ESK_ADMIN round verified
its own UI layer.

## Out of scope (explicitly — later parts or later rounds)

- Any visual change to how a category/listing page, the mega menu, or
  the product page looks (Parts 2-4).
- A true server-side 301 redirect for non-canonical URLs (would
  require introducing server-side data fetching this codebase doesn't
  have anywhere today).
- Enforcing slug-level (as opposed to name-level) uniqueness in
  ESK_API.
- Any change to `/variant/:id` or `/variant/:id/siblings` or the
  hooks that call them.
