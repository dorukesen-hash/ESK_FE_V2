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

  it('renders a buyable table row per variant on the resolved node', () => {
    useCatalogTree.mockReturnValue({ data: tree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    expect(screen.getByRole('heading', { name: 'Composite Strapping' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'A' })[0]).toHaveAttribute(
      'href',
      '/product/composite-strapping/327'
    );
    expect(screen.getAllByRole('button', { name: 'Add A to cart' }).length).toBeGreaterThan(0);
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

  it('shows a product count under each child tile, counting variants nested at any depth', () => {
    const deepTree = [
      {
        id: 9,
        name: 'BOXES',
        images: [],
        variants: [],
        children: [
          {
            id: 31,
            name: 'Corrugated Boxes',
            images: [],
            variants: [],
            children: [
              { id: 4, name: 'RSC Boxes', images: [], variants: [{ id: 1 }, { id: 2 }], children: [] },
            ],
          },
        ],
      },
    ];
    useCatalogTree.mockReturnValue({ data: deepTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['boxes']} />);
    expect(screen.getByText('2 products')).toBeInTheDocument();
  });

  it('renders both child tiles and a buyable table when a node has children and variants at once', () => {
    const mixedTree = [
      {
        id: 9,
        name: 'CORD STRAPPING',
        images: [],
        variants: [{ id: 500, title: 'Loose variant', sku: 'LV1', one_four_units: '10.00', unit: 'Each' }],
        children: [
          { id: 18, name: 'Composite Strapping', images: [], variants: [], children: [] },
        ],
      },
    ];
    useCatalogTree.mockReturnValue({ data: mixedTree, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping']} />);

    expect(screen.getByRole('link', { name: /Composite Strapping/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Loose variant/ }).length).toBeGreaterThan(0);
  });

  it("uses the resolved node's displayFields for the comparison table when set", () => {
    const treeWithDisplayFields = [
      {
        id: 9,
        name: 'CORD STRAPPING',
        images: [],
        variants: [],
        children: [
          {
            id: 18,
            name: 'Composite Strapping',
            images: [],
            children: [],
            displayFields: ['break_strength'],
            variants: [
              { id: 327, title: 'A', sku: 'X', break_strength: 750 },
              { id: 328, title: 'B', sku: 'Y', break_strength: 750 },
            ],
          },
        ],
      },
    ];
    useCatalogTree.mockReturnValue({ data: treeWithDisplayFields, isLoading: false, isError: false });
    render(<CatalogNodeView path={['cord-strapping', 'composite-strapping']} />);

    expect(screen.getAllByText('Break strength').length).toBeGreaterThan(0);
  });
});
