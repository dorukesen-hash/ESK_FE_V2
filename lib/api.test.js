import { describe, it, expect, vi, beforeEach } from 'vitest';

// axios must be mocked so the interceptor's axios wiring can be exercised
// without any real network calls. `vi.hoisted` is needed because vi.mock
// factories run before the surrounding module's top-level statements.
const { mockApiInstance, mockPost, mockUse, handlers } = vi.hoisted(() => {
  const mockApiInstance = vi.fn();
  const mockPost = vi.fn();
  const handlers = { success: null, error: null };
  const mockUse = vi.fn((successFn, errorFn) => {
    handlers.success = successFn;
    handlers.error = errorFn;
  });
  return { mockApiInstance, mockPost, mockUse, handlers };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => {
      mockApiInstance.interceptors = {
        response: { use: mockUse },
      };
      return mockApiInstance;
    }),
    post: mockPost,
  },
}));

function createDeferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('lib/api 401 refresh interceptor', () => {
  beforeEach(async () => {
    // Re-import lib/api.js fresh for every test: it holds module-level state
    // (the refresh-queue's in-flight promise) that must not leak between tests.
    vi.resetModules();
    mockPost.mockReset();
    mockApiInstance.mockReset();
    mockApiInstance.mockImplementation((config) => Promise.resolve({ config }));
    mockPost.mockResolvedValue({ data: {} });
    handlers.success = null;
    handlers.error = null;

    await import('./api.js');
  });

  it('a single 401 triggers exactly one refresh call and retries the original request once', async () => {
    const originalRequest = { url: '/orders' };
    const error = { config: originalRequest, response: { status: 401 } };

    await handlers.error(error);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh-token'),
      {},
      { withCredentials: true }
    );
    expect(mockApiInstance).toHaveBeenCalledTimes(1);
    expect(mockApiInstance).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/orders', _retried: true })
    );
  });

  it('dedupes two concurrent 401s into a single refresh call (thundering-herd protection)', async () => {
    const deferred = createDeferred();
    mockPost.mockReturnValue(deferred.promise);

    const req1 = { url: '/a' };
    const req2 = { url: '/b' };
    const err1 = { config: req1, response: { status: 401 } };
    const err2 = { config: req2, response: { status: 401 } };

    const p1 = handlers.error(err1);
    const p2 = handlers.error(err2);

    // Both handlers should have already reached (and reused) the shared
    // in-flight refresh promise before it resolves.
    expect(mockPost).toHaveBeenCalledTimes(1);

    deferred.resolve({ data: {} });
    await Promise.all([p1, p2]);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockApiInstance).toHaveBeenCalledTimes(2);
    expect(req1._retried).toBe(true);
    expect(req2._retried).toBe(true);
  });

  it('does not retry a request that has already been retried (infinite-loop guard)', async () => {
    const originalRequest = { url: '/orders', _retried: true };
    const error = { config: originalRequest, response: { status: 401 } };

    await expect(handlers.error(error)).rejects.toBe(error);

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockApiInstance).not.toHaveBeenCalled();
  });

  it('rejects non-401 errors without calling the refresh endpoint', async () => {
    const originalRequest = { url: '/orders' };
    const error = { config: originalRequest, response: { status: 500 } };

    await expect(handlers.error(error)).rejects.toBe(error);

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockApiInstance).not.toHaveBeenCalled();
  });
});
