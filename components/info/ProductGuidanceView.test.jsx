import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductGuidanceView } from './ProductGuidanceView';

describe('ProductGuidanceView', () => {
  it('renders the page heading and all four guidance items', () => {
    render(<ProductGuidanceView />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Get the right packaging for your application',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Choose the right material')).toBeInTheDocument();
    expect(screen.getByText('Match the right specifications')).toBeInTheDocument();
    expect(screen.getByText('Avoid costly ordering mistakes')).toBeInTheDocument();
    expect(screen.getByText('Plan the right buying quantity')).toBeInTheDocument();
  });

  it('links the CTA to the quote page', () => {
    render(<ProductGuidanceView />);
    expect(
      screen.getByRole('link', { name: /Get Product Guidance/ })
    ).toHaveAttribute('href', '/quote');
  });
});
