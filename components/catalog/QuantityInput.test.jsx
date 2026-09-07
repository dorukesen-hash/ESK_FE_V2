import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityInput } from './QuantityInput';

describe('QuantityInput', () => {
  it('replaces the value when cleared and retyped, instead of appending', async () => {
    const onChange = vi.fn();
    render(<QuantityInput id="qty" value={2} onChange={onChange} />);

    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '5');

    expect(input).toHaveValue(5);
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('does not call onChange while the field is empty mid-edit', async () => {
    const onChange = vi.fn();
    render(<QuantityInput id="qty" value={2} onChange={onChange} />);

    await userEvent.clear(screen.getByRole('spinbutton'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('restores the last committed value on blur if left empty', async () => {
    const onChange = vi.fn();
    render(<QuantityInput id="qty" value={2} onChange={onChange} />);

    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.tab();

    expect(input).toHaveValue(2);
  });
});
