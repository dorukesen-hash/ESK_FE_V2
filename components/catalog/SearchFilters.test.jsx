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
