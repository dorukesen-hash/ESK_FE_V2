import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

import { GoogleAuthRedirect } from './GoogleAuthRedirect';

describe('GoogleAuthRedirect', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('redirects to /account on mount', () => {
    render(<GoogleAuthRedirect />);
    expect(replace).toHaveBeenCalledWith('/account');
  });
});
