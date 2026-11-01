import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBanner } from './HeroBanner';

describe('HeroBanner', () => {
  it('renders the static slide heading, subtitle, and CTA', () => {
    render(<HeroBanner />);
    expect(
      screen.getByRole('heading', {
        name: 'Industrial packaging supplies for every business',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Strapping, tools, stretch film and more, sourced and shipped in bulk.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Shop Products/ })).toHaveAttribute(
      'href',
      '/search'
    );
  });

  it('renders no slide-navigation controls', () => {
    render(<HeroBanner />);
    expect(screen.queryByRole('button', { name: /Go to slide/ })).not.toBeInTheDocument();
  });
});
