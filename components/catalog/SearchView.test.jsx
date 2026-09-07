import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearch } from '@/hooks/useSearch';
import { SearchView } from './SearchView';

const push = vi.fn();
let searchParamsValue = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock('@/hooks/useSearch', () => ({
  useSearch: vi.fn(),
}));

describe('SearchView', () => {
  beforeEach(() => {
    push.mockClear();
    searchParamsValue = '';
  });

  it('shows "All Products" and result count with no query', () => {
    useSearch.mockReturnValue({
      data: { count: 2, results: [] },
      isLoading: false,
      isError: false,
    });
    render(<SearchView />);
    expect(screen.getByRole('heading', { name: 'All Products' })).toBeInTheDocument();
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('shows the query in the heading and lists results with SKU and breadcrumb', () => {
    searchParamsValue = 'q=strap';
    useSearch.mockReturnValue({
      data: {
        count: 1,
        results: [
          {
            id: 327,
            title: 'Composite Strapping',
            sku: 'CC40/2',
            categoryName: 'CORD STRAPPING',
            subcategoryName: 'Composite Strapping',
            href: '/product/composite-strapping/327',
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<SearchView />);

    expect(
      screen.getByRole('heading', { name: 'Search results for "strap"' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Composite Strapping' })
    ).toHaveAttribute('href', '/product/composite-strapping/327');
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('CORD STRAPPING / Composite Strapping')).toBeInTheDocument();
  });

  it('shows an empty-results message when nothing matches', () => {
    useSearch.mockReturnValue({ data: { count: 0, results: [] }, isLoading: false, isError: false });
    render(<SearchView />);
    expect(screen.getByText('No results. Try a different search term.')).toBeInTheDocument();
  });

  it('navigates to the new query on submit', async () => {
    useSearch.mockReturnValue({ data: { count: 0, results: [] }, isLoading: false, isError: false });
    render(<SearchView />);

    await userEvent.type(screen.getByLabelText('Search products'), 'tape');
    await userEvent.keyboard('{Enter}');

    expect(push).toHaveBeenCalledWith('/search?q=tape');
  });
});
