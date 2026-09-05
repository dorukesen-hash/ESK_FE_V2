import { describe, it, expect, vi } from 'vitest';
import { createRefreshQueue } from './refreshQueue';

describe('createRefreshQueue', () => {
  it('dedupes concurrent calls into a single underlying refresh call', async () => {
    let resolveRefresh;
    const refreshFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );
    const { getRefreshPromise } = createRefreshQueue(refreshFn);

    const p1 = getRefreshPromise();
    const p2 = getRefreshPromise();
    const p3 = getRefreshPromise();

    expect(refreshFn).toHaveBeenCalledTimes(1);

    resolveRefresh();
    await Promise.all([p1, p2, p3]);

    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('starts a new underlying call after the previous one resolves', async () => {
    const refreshFn = vi.fn(() => Promise.resolve());
    const { getRefreshPromise } = createRefreshQueue(refreshFn);

    await getRefreshPromise();
    await getRefreshPromise();

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('lets a rejected refresh propagate to all waiters and clears state for the next call', async () => {
    const refreshFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce(undefined);
    const { getRefreshPromise } = createRefreshQueue(refreshFn);

    await expect(Promise.all([getRefreshPromise(), getRefreshPromise()])).rejects.toThrow(
      'refresh failed'
    );

    await expect(getRefreshPromise()).resolves.toBeUndefined();
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });
});
