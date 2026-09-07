import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutUsView } from './AboutUsView';

describe('AboutUsView', () => {
  it('renders the heading and real contact info', () => {
    render(<AboutUsView />);
    expect(
      screen.getByRole('heading', { name: 'Who We Are at ESK Packaging' })
    ).toBeInTheDocument();
    expect(screen.getByText('469-992-2447')).toHaveAttribute('href', 'tel:+14699922447');
    expect(screen.getByText('sales@eskpackaging.com')).toHaveAttribute(
      'href',
      'mailto:sales@eskpackaging.com'
    );
  });
});
