import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReturnRefundPolicyView } from './ReturnRefundPolicyView';

describe('ReturnRefundPolicyView', () => {
  it('renders the heading and the key policy facts', () => {
    render(<ReturnRefundPolicyView />);
    expect(
      screen.getByRole('heading', { name: 'Return & Refund Policy', level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/30 days of the delivery date/)).toBeInTheDocument();
    expect(screen.getByText(/15% restocking fee applies/)).toBeInTheDocument();
    expect(screen.getByText(/7–10 business days/)).toBeInTheDocument();
  });
});
