'use client';

import { useEffect, useState } from 'react';
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
  const shouldBeOpen = isActiveCategory || hasActiveSubcategory;
  const [open, setOpen] = useState(shouldBeOpen);
  const hasChildren = children.length > 0;

  // The initializer above only runs once, at mount - every CategoryGroup
  // mounts together when the tree first loads, keyed by node.id, so
  // selecting a different category/subcategory later (via router.push,
  // no remount) re-renders every group with new props but never
  // reconsiders this state. Without this, a group that becomes the
  // active one after mount stays collapsed, hiding the very filter the
  // URL says is selected; a previously-active group that loses the
  // selection stays stuck open. Force-opening (never force-closing)
  // keeps the active filter visible while still letting a manual click
  // freely expand or collapse any other group to browse.
  useEffect(() => {
    if (shouldBeOpen) setOpen(true);
  }, [shouldBeOpen]);

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
