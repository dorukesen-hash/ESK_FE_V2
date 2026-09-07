import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShippingPolicyView } from './ShippingPolicyView';

describe('ShippingPolicyView', () => {
  it('renders the heading and real support email', () => {
    render(<ShippingPolicyView />);
    expect(screen.getByRole('heading', { name: 'Shipping Policy', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('sales@eskpackaging.com')).toHaveAttribute(
      'href',
      'mailto:sales@eskpackaging.com'
    );
  });
});
