import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('links every item except the last, current one', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Cord Strapping', href: '/category/cord-strapping' },
          { label: 'Composite Strapping' },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Cord Strapping' })).toHaveAttribute(
      'href',
      '/category/cord-strapping'
    );
    const current = screen.getByText('Composite Strapping');
    expect(current.tagName).not.toBe('A');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('sticks itself below the chrome and publishes its own height for anything below it', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />);

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toHaveClass('breadcrumbs-sticky', 'bg-background');
    expect(document.documentElement.style.getPropertyValue('--breadcrumbs-height')).toBe('0px');
  });
});
