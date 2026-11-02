import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the company links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute(
      'href',
      '/about-us'
    );
    expect(screen.getByRole('link', { name: 'Track Order' })).toHaveAttribute(
      'href',
      '/track-order'
    );
    expect(
      screen.getByRole('link', { name: 'Product Guidance' })
    ).toHaveAttribute('href', '/product-guidance');
    expect(
      screen.getByRole('link', { name: 'Request a Quote' })
    ).toHaveAttribute('href', '/quote');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute(
      'href',
      '/faq'
    );
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'href',
      '/support'
    );
  });

  it('renders the policy links', () => {
    render(<Footer />);
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/privacy-policy');
    expect(
      screen.getByRole('link', { name: 'Shipping Policy' })
    ).toHaveAttribute('href', '/shipping-policy');
    expect(
      screen.getByRole('link', { name: 'Return & Refund Policy' })
    ).toHaveAttribute('href', '/return-refund-policy');
    expect(
      screen.getByRole('link', { name: 'Terms and Conditions' })
    ).toHaveAttribute('href', '/terms-and-conditions');
  });

  it('renders the current year in the copyright line', () => {
    render(<Footer />);
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))
    ).toBeInTheDocument();
  });
});
