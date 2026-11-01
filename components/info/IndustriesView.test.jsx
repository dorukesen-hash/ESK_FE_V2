import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndustriesView } from './IndustriesView';

describe('IndustriesView', () => {
  it('renders all three industries linking to a real category', () => {
    render(<IndustriesView />);

    expect(
      screen.getByRole('link', { name: /Lumber, Doors & Building Materials/ })
    ).toHaveAttribute('href', '/category/cord-strapping');
    expect(
      screen.getByRole('link', { name: /Manufacturing & Metalworking/ })
    ).toHaveAttribute('href', '/category/lashing-equipment');
    expect(
      screen.getByRole('link', { name: /Warehousing, 3PL & Distribution/ })
    ).toHaveAttribute('href', '/category/stretch-film');
  });
});
