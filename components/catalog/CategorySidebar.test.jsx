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

describe('CategorySidebar', () => {
  it('renders every node in the active department as a link, except the current node', () => {
    render(<CategorySidebar tree={tree} currentNodeId={2} />);

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

  it('also renders every other top-level department in the catalog, not just the active one', () => {
    render(<CategorySidebar tree={tree} currentNodeId={2} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByRole('link', { name: 'EDGE PROTECTION' })).toHaveAttribute(
      'href',
      '/category/edge-protection'
    );
    expect(within(nav).getByRole('link', { name: 'Corner Board' })).toHaveAttribute(
      'href',
      '/category/edge-protection/corner-board'
    );
  });

  it('highlights the current node correctly at any depth, including a grandchild', () => {
    render(<CategorySidebar tree={tree} currentNodeId={4} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByText('Composite Strapping')).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Cord Strapping' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'PET Strapping' })).toBeInTheDocument();
  });

  it('highlights a top-level department itself when it is the current node', () => {
    render(<CategorySidebar tree={tree} currentNodeId={1} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByText('STRAPPING & LOAD SECUREMENT')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: 'Cord Strapping' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'EDGE PROTECTION' })).toBeInTheDocument();
  });

  it('caps its own height to the main content column and scrolls internally instead of growing the page', () => {
    render(<CategorySidebar tree={tree} currentNodeId={2} />);

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(nav).toHaveClass(
      'helper-sticky-under-breadcrumbs',
      'lg:max-h-[var(--category-content-height,none)]',
      'lg:overflow-y-auto',
      'scrollbar-thin'
    );
  });

  it('renders a lone department with no children at all without throwing', () => {
    const lonelyTree = [{ id: 20, name: 'Solo Department', children: [] }];
    expect(() =>
      render(<CategorySidebar tree={lonelyTree} currentNodeId={20} />)
    ).not.toThrow();

    const nav = screen.getByRole('navigation', { name: 'Category' });
    expect(within(nav).getByText('Solo Department')).toHaveAttribute('aria-current', 'page');
  });
});
