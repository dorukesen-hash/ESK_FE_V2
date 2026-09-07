import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaqView } from './FaqView';

describe('FaqView', () => {
  it('renders every section heading', () => {
    render(<FaqView />);
    expect(screen.getByText('Ordering & Account')).toBeInTheDocument();
    expect(screen.getByText('Shipping & Delivery')).toBeInTheDocument();
    expect(screen.getByText('Returns & Refunds')).toBeInTheDocument();
    expect(screen.getByText('Payment & Billing')).toBeInTheDocument();
  });

  it('filters questions by the search box, hiding sections with no matches', async () => {
    render(<FaqView />);
    await userEvent.type(screen.getByLabelText('Search FAQ'), 'Net 30');

    expect(screen.getByText('Ordering & Account')).toBeInTheDocument();
    expect(screen.queryByText('Shipping & Delivery')).not.toBeInTheDocument();
  });

  it('links out to every policy page', () => {
    render(<FaqView />);
    expect(screen.getByRole('link', { name: 'Terms & Conditions' })).toHaveAttribute(
      'href',
      '/terms-and-conditions'
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy-policy'
    );
    expect(screen.getByRole('link', { name: 'Shipping Policy' })).toHaveAttribute(
      'href',
      '/shipping-policy'
    );
    expect(screen.getByRole('link', { name: 'Return & Refund Policy' })).toHaveAttribute(
      'href',
      '/return-refund-policy'
    );
  });
});
