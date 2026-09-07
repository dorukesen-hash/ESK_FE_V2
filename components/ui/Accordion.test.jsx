import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('shows an answer only after its question is clicked', async () => {
    render(<Accordion items={[{ q: 'How do I place an order?', a: 'Browse and check out.' }]} />);

    expect(screen.queryByText('Browse and check out.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /How do I place an order/ }));
    expect(screen.getByText('Browse and check out.')).toBeInTheDocument();
  });

  it('shows an empty state when no items match', () => {
    render(<Accordion items={[]} />);
    expect(screen.getByText('No matching questions.')).toBeInTheDocument();
  });
});
