import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCategories } from '@/hooks/useCategories';
import { Navbar } from './Navbar';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

describe('Navbar', () => {
  it('renders About Us as a real link', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute(
      'href',
      '/about-us'
    );
  });

  it('renders Knowledge Center as a disabled, non-navigating item', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);

    const item = screen.getByText('Knowledge Center').closest('[aria-disabled="true"]');
    expect(item).toBeInTheDocument();
    expect(item.tagName).not.toBe('A');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders Industries We Serve as a real link to the homepage section', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(
      screen.getByRole('link', { name: 'Industries We Serve' })
    ).toHaveAttribute('href', '/#industries');
  });

  it('shows a loading state inside the mega menu', async () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));
    expect(await screen.findByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows an error state inside the mega menu', async () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));
    expect(await screen.findByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders each category with its subcategories and a View All Products link', async () => {
    useCategories.mockReturnValue({
      data: [
        {
          id: 12,
          name: 'EDGE PROTECTION',
          subcategories: [
            { id: 24, name: 'Corner Board' },
            { id: 25, name: 'Strapping Protectors' },
          ],
        },
        { id: 7, name: 'Stretch Wrap', subcategories: [] },
      ],
      isLoading: false,
      isError: false,
    });
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /Shop Products/ }));

    expect(
      await screen.findByRole('menuitem', { name: 'EDGE PROTECTION' })
    ).toHaveAttribute('href', '/category/edge-protection');
    expect(
      screen.getByRole('menuitem', { name: 'Corner Board' })
    ).toHaveAttribute('href', '/category/edge-protection/corner-board');
    expect(
      screen.getByRole('menuitem', { name: 'Strapping Protectors' })
    ).toHaveAttribute('href', '/category/edge-protection/strapping-protectors');
    expect(
      screen.getByRole('menuitem', { name: 'Stretch Wrap' })
    ).toHaveAttribute('href', '/category/stretch-wrap');
    expect(
      screen.getByRole('menuitem', { name: 'View All Products →' })
    ).toHaveAttribute('href', '/search');
  });
});
