import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCatalogTree } from '@/hooks/useCatalogTree';
import { Navbar } from './Navbar';

vi.mock('@/hooks/useCatalogTree', () => ({
  useCatalogTree: vi.fn(),
}));

describe('Navbar', () => {
  it('renders About Us as a real link', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute(
      'href',
      '/about-us'
    );
  });

  it('renders Knowledge Center as a disabled, non-navigating item', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);

    const item = screen.getByText('Knowledge Center').closest('[aria-disabled="true"]');
    expect(item).toBeInTheDocument();
    expect(item.tagName).not.toBe('A');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders Industries We Serve as a real link to its own page', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'Industries We Serve' })
    ).toHaveAttribute('href', '/industries');
  });

  it('renders View All Products as a standalone top-level link', () => {
    useCatalogTree.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'View All Products →' })
    ).toHaveAttribute('href', '/search');
  });

  it('shows a loading state in the bar while categories load', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows an error state in the bar when categories fail to load', () => {
    useCatalogTree.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Navbar />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders every top-level category as a real, always-visible link', () => {
    useCatalogTree.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION', children: [] },
        { id: 7, name: 'Stretch Wrap', children: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    expect(screen.getByRole('link', { name: 'EDGE PROTECTION' })).toHaveAttribute(
      'href',
      '/category/edge-protection'
    );
    expect(screen.getByRole('link', { name: 'Stretch Wrap' })).toHaveAttribute(
      'href',
      '/category/stretch-wrap'
    );
  });

  it('does not render a chevron dropdown for a category with no children', () => {
    useCatalogTree.mockReturnValue({
      data: [{ id: 7, name: 'Stretch Wrap', children: [] }],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);
    expect(
      screen.queryByRole('button', { name: 'Stretch Wrap submenu' })
    ).not.toBeInTheDocument();
  });

  it(
    "opens only one category's own children in its chevron dropdown, not every category's",
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [
              { id: 24, name: 'Corner Board', children: [] },
              { id: 25, name: 'Strapping Protectors', children: [] },
            ],
          },
          {
            id: 7,
            name: 'Stretch Wrap',
            children: [{ id: 30, name: 'Hand Wrap', children: [] }],
          },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));

      expect(await screen.findByRole('link', { name: 'Corner Board' })).toHaveAttribute(
        'href',
        '/category/edge-protection/corner-board'
      );
      expect(screen.getByRole('link', { name: 'Strapping Protectors' })).toHaveAttribute(
        'href',
        '/category/edge-protection/strapping-protectors'
      );
      expect(screen.queryByRole('link', { name: 'Hand Wrap' })).not.toBeInTheDocument();
    }
  );

  it(
    'closes the first dropdown when a second category is opened',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          { id: 12, name: 'EDGE PROTECTION', children: [{ id: 24, name: 'Corner Board', children: [] }] },
          { id: 7, name: 'Stretch Wrap', children: [{ id: 30, name: 'Hand Wrap', children: [] }] },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));
      expect(await screen.findByRole('link', { name: 'Corner Board' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Stretch Wrap submenu' }));
      expect(await screen.findByRole('link', { name: 'Hand Wrap' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Corner Board' })).not.toBeInTheDocument();
    }
  );

  it(
    "a mousedown inside the open dropdown's own content does not close it",
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [{ id: 24, name: 'Corner Board', children: [] }],
          },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));
      const cornerBoardLink = await screen.findByRole('link', { name: 'Corner Board' });

      fireEvent.mouseDown(cornerBoardLink);

      expect(screen.getByRole('link', { name: 'Corner Board' })).toBeInTheDocument();
    }
  );

  it(
    'closes the dropdown once a link inside it is actually clicked',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [{ id: 24, name: 'Corner Board', children: [] }],
          },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);

      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));
      const cornerBoardLink = await screen.findByRole('link', { name: 'Corner Board' });

      fireEvent.click(cornerBoardLink);

      expect(screen.queryByRole('link', { name: 'Corner Board' })).not.toBeInTheDocument();
    }
  );

  it('moves focus into the dropdown once it opens', async () => {
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 12,
          name: 'EDGE PROTECTION',
          children: [{ id: 24, name: 'Corner Board', children: [] }],
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));
    const cornerBoardLink = await screen.findByRole('link', { name: 'Corner Board' });

    expect(cornerBoardLink).toHaveFocus();
  });

  it('closes the dropdown and returns focus to its trigger on Escape', async () => {
    useCatalogTree.mockReturnValue({
      data: [
        {
          id: 12,
          name: 'EDGE PROTECTION',
          children: [{ id: 24, name: 'Corner Board', children: [] }],
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'EDGE PROTECTION submenu' });
    await userEvent.click(trigger);
    await screen.findByRole('link', { name: 'Corner Board' });

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('link', { name: 'Corner Board' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it(
    'renders a grandchild (3rd level) with the full canonical path inside the category dropdown',
    { timeout: 15000, retry: 2 },
    async () => {
      useCatalogTree.mockReturnValue({
        data: [
          {
            id: 12,
            name: 'EDGE PROTECTION',
            children: [
              {
                id: 24,
                name: 'Corner Board',
                children: [{ id: 99, name: 'White Corner Board', children: [] }],
              },
            ],
          },
        ],
        isLoading: false,
        isError: false,
      });
      render(<Navbar />);
      await userEvent.click(screen.getByRole('button', { name: 'EDGE PROTECTION submenu' }));

      expect(
        await screen.findByRole('link', { name: 'White Corner Board' })
      ).toHaveAttribute('href', '/category/edge-protection/corner-board/white-corner-board');
    }
  );
});
