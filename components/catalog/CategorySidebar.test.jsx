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
