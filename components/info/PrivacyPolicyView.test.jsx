import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyPolicyView } from './PrivacyPolicyView';

describe('PrivacyPolicyView', () => {
  it('renders the heading and key sections', () => {
    render(<PrivacyPolicyView />);
    expect(screen.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('1. Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('3. Payment Security and Processing')).toBeInTheDocument();
    expect(
      screen.getByText('We do not store or retain any payment card details on our servers.')
    ).toBeInTheDocument();
  });
});
