import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveImageUrl } from './cdn';

describe('resolveImageUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CDN_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.eskpackaging.com/';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CDN_URL = originalEnv;
  });

  it('joins a CDN base with a trailing slash and a path with a leading slash without doubling the slash', () => {
    expect(resolveImageUrl('/images/box.png')).toBe(
      'https://cdn.eskpackaging.com/images/box.png'
    );
  });

  it('joins a path with no leading slash', () => {
    expect(resolveImageUrl('images/box.png')).toBe(
      'https://cdn.eskpackaging.com/images/box.png'
    );
  });

  it('passes through already-absolute URLs unchanged', () => {
    expect(resolveImageUrl('https://other-host.com/x.png')).toBe(
      'https://other-host.com/x.png'
    );
  });

  it('returns null for a nullish path', () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl(undefined)).toBeNull();
    expect(resolveImageUrl('')).toBeNull();
  });
});
