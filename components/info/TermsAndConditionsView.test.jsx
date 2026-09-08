import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TermsAndConditionsView } from './TermsAndConditionsView';

describe('TermsAndConditionsView', () => {
  it('renders the heading and key sections', () => {
    render(<TermsAndConditionsView />);
    expect(
      screen.getByRole('heading', { name: 'Terms and Conditions of Sale and Website Use' })
    ).toBeInTheDocument();
    expect(screen.getByText('Effective Date: July 10, 2025')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Returns, Claims, and Defective Goods' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Return & Refund Policy' })
    ).toHaveAttribute('href', '/return-refund-policy');
  });
});
