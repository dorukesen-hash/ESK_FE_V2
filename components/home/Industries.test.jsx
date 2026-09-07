import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Industries } from './Industries';

describe('Industries', () => {
  it('renders all three industries linking to a real category', () => {
    render(<Industries />);

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

  it('has the #industries anchor for the navbar link to target', () => {
    const { container } = render(<Industries />);
    expect(container.querySelector('#industries')).toBeInTheDocument();
  });
});
