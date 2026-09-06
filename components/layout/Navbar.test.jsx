import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCategories } from '@/hooks/useCategories';
import { Navbar } from './Navbar';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

describe('Navbar', () => {
  it('shows a loading state', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<Navbar />);
    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    useCategories.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Navbar />);
    expect(screen.getByText('Categories unavailable.')).toBeInTheDocument();
  });

  it('renders a slugified link per category', () => {
    useCategories.mockReturnValue({
      data: [
        { id: 12, name: 'EDGE PROTECTION' },
        { id: 7, name: 'Stretch Wrap' },
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
});
