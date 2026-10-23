import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { CatalogNodeView } from './CatalogNodeView';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

const tree = [
  {
    id: 9,
    name: 'CORD STRAPPING',
    images: [],
    variants: [],
    children: [
      {
        id: 18,
        name: 'Composite Strapping',
        images: [{ image: { url: 'images/composite.jpg' } }],
        variants: [
          { id: 327, title: 'A', sku: 'CC40/2', one_four_units: '68.00', unit: 'Coils' },
        ],
        children: [],
      },
    ],
  },
];

describe('CatalogNodeView', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('shows a not-found message when the slug does not resolve', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['nonexistent']} />);
    expect(screen.getByText("We couldn't find that category.")).toBeInTheDocument();
  });

  it("renders child tiles linking to each child's canonical path", () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    expect(screen.getByRole('heading', { name: 'CORD STRAPPING' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Composite Strapping/ })
    ).toHaveAttribute('href', '/category/cord-strapping/composite-strapping');
  });

  it('renders a product card per variant on the resolved node', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^A/ })).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
  });

  it('redirects to the canonical path when the URL does not match it', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['old-slug', 'composite-strapping']} />);
    expect(replace).toHaveBeenCalledWith('/category/cord-strapping/composite-strapping');
  });

  it('does not redirect when the URL already matches the canonical path', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a "nothing here yet" message for a leaf node with no children or variants', () => {
    const emptyTree = [{ id: 1, name: 'Empty Node', images: [], variants: [], children: [] }];
    useCatalogTree.mockReturnValue({ data: emptyTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['empty-node']} />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('resolves a node from its last segment alone and redirects a short URL to the full canonical path', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['composite-strapping']} />);
    expect(replace).toHaveBeenCalledWith('/category/cord-strapping/composite-strapping');
  });
});
