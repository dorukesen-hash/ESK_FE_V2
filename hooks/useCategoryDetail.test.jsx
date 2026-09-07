import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCategoryDetail } from './useCategoryDetail';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCategoryDetail', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    api.get.mockReset();
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('finds the category by slug and summarizes its subcategories', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 9,
          name: 'CORD STRAPPING',
          subcategories: [
            {
              id: 18,
              name: 'Composite Strapping',
              subcategory_images: [{ image: { url: 'images/composite.jpg' } }],
              variants: [{ id: 1 }, { id: 2 }],
              products: [{ variants: [{ id: 3 }] }],
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useCategoryDetail('cord-strapping'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 9,
      name: 'CORD STRAPPING',
      subcategories: [
        {
          id: 18,
          name: 'Composite Strapping',
          slug: 'composite-strapping',
          image: 'https://cdn.eskpackaging.com/images/composite.jpg',
          productCount: 3,
        },
      ],
    });
  });

  it('returns null when no category matches the slug', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, name: 'BOXES', subcategories: [] }] });
    const { result } = renderHook(() => useCategoryDetail('nonexistent'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
