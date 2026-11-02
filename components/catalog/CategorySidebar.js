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

// Renders every top-level department in the catalog, not just the one
// the current page belongs to - matching the always-visible-everything
// nav bar from Part 2, this sidebar is a full catalog navigator, not a
// scoped-to-current-branch one.
// lg:max-h-[var(--category-content-height,none)] caps this nav to the
// main content column's own real measured height (set by CatalogNodeView
// via useElementHeightVar), not a percentage/viewport guess: a grid row's
// auto height is the MAX of every item's natural content size, including
// a percentage-height item (it resolves to "auto" - its own content size -
// whenever the row it's sizing is itself indefinite), so height:100% on
// this nav fed its own full (now every-department-long) size straight
// back into the row instead of ever being capped by it. An explicit
// max-height, measured from the sibling that should actually be driving
// the page's height, is what makes this nav - not vice versa - the thing
// that gets capped. Whatever doesn't fit inside that height scrolls
// inside this nav instead of ever growing the page.
// helper-sticky-under-breadcrumbs (see globals.css) sticks it right
// below the real, measured height of the chrome + this page's own
// Breadcrumbs bar, instead of a guessed fixed offset.
export function CategorySidebar({ tree, currentNodeId }) {
  return (
    <nav
      aria-label="Category"
      className="scrollbar-thin helper-sticky-under-breadcrumbs lg:max-h-[var(--category-content-height,none)] lg:overflow-y-auto"
    >
      <ul>
        {tree.map((department) => (
          <SidebarNode
            key={department.id}
            tree={tree}
            node={department}
            currentNodeId={currentNodeId}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}
