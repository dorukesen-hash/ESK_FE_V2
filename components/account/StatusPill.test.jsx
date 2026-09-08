import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders a dash when there is no status', () => {
    render(<StatusPill status={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('color-codes each known status differently', () => {
    const cases = [
      ['Pending', 'bg-amber-50'],
      ['In Progress', 'bg-blue-50'],
      ['Completed', 'bg-green-50'],
      ['On Hold', 'bg-orange-50'],
      ['Cancelled', 'bg-red-50'],
      ['Refunded', 'bg-purple-50'],
    ];

    for (const [status, expectedClass] of cases) {
      const { unmount } = render(<StatusPill status={status} />);
      expect(screen.getByText(status)).toHaveClass(expectedClass);
      unmount();
    }
  });

  it('falls back to a neutral style for an unrecognized status', () => {
    render(<StatusPill status="Something Else" />);
    expect(screen.getByText('Something Else')).toHaveClass('bg-accent-tint');
  });
});
