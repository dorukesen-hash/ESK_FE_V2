import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressForm } from './AddressForm';

describe('AddressForm', () => {
  it('shows validation errors for empty required fields', async () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Get Shipping Rates' }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Address is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a state code that is not 2 letters', async () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText('State'), 'Texas');
    await userEvent.click(screen.getByRole('button', { name: 'Get Shipping Rates' }));
    expect(await screen.findByText('Use the 2-letter state code')).toBeInTheDocument();
  });

  it('submits the address when every field is valid', async () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Phone'), '5551234567');
    await userEvent.type(screen.getByLabelText('Address'), '123 Main St');
    await userEvent.type(screen.getByLabelText('City'), 'Dallas');
    await userEvent.type(screen.getByLabelText('State'), 'TX');
    await userEvent.type(screen.getByLabelText('ZIP'), '75201');
    await userEvent.click(screen.getByRole('button', { name: 'Get Shipping Rates' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        state: 'TX',
        postalCode: '75201',
      }),
      expect.anything()
    );
  });

  it('disables the submit button and shows a loading label while submitting', () => {
    render(<AddressForm onSubmit={vi.fn()} isSubmitting={true} />);
    const button = screen.getByRole('button', { name: 'Getting shipping rates…' });
    expect(button).toBeDisabled();
  });
});
