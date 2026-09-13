'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

function CategoryGroup({
  category,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
}) {
  const isActiveCategory = selectedCategoryId === category.id && !selectedSubcategoryId;
  const hasActiveSubcategory = category.subcategories.some(
    (subcategory) => subcategory.id === selectedSubcategoryId
  );
  const [open, setOpen] = useState(isActiveCategory || hasActiveSubcategory);
  const hasSubcategories = category.subcategories.length > 0;

  return (
    <div className="border-b border-border py-3 first:pt-0 last:border-b-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={`flex-1 text-left text-sm font-bold uppercase tracking-wide transition-colors ${
            isActiveCategory || hasActiveSubcategory
              ? 'text-primary'
              : 'text-text-primary hover:text-primary'
          }`}
        >
          {category.name}
        </button>
        {hasSubcategories && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${category.name}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-text-muted transition-colors hover:text-primary"
          >
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {open && hasSubcategories && (
        <ul className="mt-2 space-y-1.5 border-l-2 border-accent-tint-strong pl-3">
          {category.subcategories.map((subcategory) => {
            const active = selectedSubcategoryId === subcategory.id;
            return (
              <li key={subcategory.id}>
                <button
                  type="button"
                  onClick={() => onSelectSubcategory(category.id, subcategory.id)}
                  className={`block w-full py-0.5 text-left text-sm transition-colors ${
                    active ? 'font-semibold text-primary' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  {subcategory.name}
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
  const { data: categories, isLoading, isError } = useCategories();
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
        {categories?.map((category) => (
          <CategoryGroup
            key={category.id}
            category={category}
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
