import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAddresses } from '@/hooks/useAddresses';
import { useCreateAddress } from '@/hooks/useCreateAddress';
import { useUpdateAddress } from '@/hooks/useUpdateAddress';
import { useDeleteAddress } from '@/hooks/useDeleteAddress';
import { AddressesView } from './AddressesView';

vi.mock('@/hooks/useAddresses', () => ({ useAddresses: vi.fn() }));
vi.mock('@/hooks/useCreateAddress', () => ({ useCreateAddress: vi.fn() }));
vi.mock('@/hooks/useUpdateAddress', () => ({ useUpdateAddress: vi.fn() }));
vi.mock('@/hooks/useDeleteAddress', () => ({ useDeleteAddress: vi.fn() }));

const address = {
  id: 16,
  title: 'Warehouse',
  firstline: '123 Main St',
  secondline: null,
  phone: '4699922447',
  city: 'Garland',
  state: 'TX',
  zip: '75042',
};

describe('AddressesView', () => {
  const createMutateAsync = vi.fn();
  const updateMutateAsync = vi.fn();
  const deleteMutateAsync = vi.fn();

  beforeEach(() => {
    createMutateAsync.mockReset().mockResolvedValue({});
    updateMutateAsync.mockReset().mockResolvedValue({});
    deleteMutateAsync.mockReset().mockResolvedValue({});
    useCreateAddress.mockReturnValue({ mutateAsync: createMutateAsync, isPending: false });
    useUpdateAddress.mockReturnValue({ mutateAsync: updateMutateAsync, isPending: false });
    useDeleteAddress.mockReturnValue({ mutateAsync: deleteMutateAsync, isPending: false });
  });

  it('shows an empty state', () => {
    useAddresses.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<AddressesView />);
    expect(screen.getByText("You don't have any saved addresses yet.")).toBeInTheDocument();
  });

  it('lists a saved address', () => {
    useAddresses.mockReturnValue({ data: [address], isLoading: false, isError: false });
    render(<AddressesView />);
    expect(screen.getByText('Warehouse')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Garland, TX, 75042')).toBeInTheDocument();
  });

  it('adds a new address through the modal', async () => {
    useAddresses.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<AddressesView />);

    await userEvent.click(screen.getByRole('button', { name: 'Add address' }));
    await userEvent.type(screen.getByLabelText('Label (e.g. Warehouse)'), 'Office');
    await userEvent.type(screen.getByLabelText('Address'), '456 Oak Ave');
    await userEvent.type(screen.getByLabelText('City'), 'Dallas');
    await userEvent.type(screen.getByLabelText('State'), 'TX');
    await userEvent.type(screen.getByLabelText('ZIP'), '75201');
    await userEvent.click(screen.getByRole('button', { name: 'Add address' }));

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Office',
        firstline: '456 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
      })
    );
  });

  it('edits an existing address, pre-filling the form', async () => {
    useAddresses.mockReturnValue({ data: [address], isLoading: false, isError: false });
    render(<AddressesView />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Label (e.g. Warehouse)')).toHaveValue('Warehouse');

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ id: 16, title: 'Warehouse' })
    );
  });

  it('deletes an address after confirming', async () => {
    useAddresses.mockReturnValue({ data: [address], isLoading: false, isError: false });
    render(<AddressesView />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(deleteMutateAsync).toHaveBeenCalledWith(16);
  });
});
