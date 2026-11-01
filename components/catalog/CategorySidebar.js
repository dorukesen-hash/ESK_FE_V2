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
