'use client';

import { useState } from 'react';
import { MapPin, Phone, Plus } from 'lucide-react';
import { useAddresses } from '@/hooks/useAddresses';
import { useCreateAddress } from '@/hooks/useCreateAddress';
import { useUpdateAddress } from '@/hooks/useUpdateAddress';
import { useDeleteAddress } from '@/hooks/useDeleteAddress';
import { AddressFormModal } from './AddressFormModal';
import { Button } from '@/components/ui/Button';

export function AddressesView() {
  const { data: addresses, isLoading, isError } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  function openAddModal() {
    setEditingAddress(null);
    setModalOpen(true);
  }

  function openEditModal(address) {
    setEditingAddress(address);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    if (editingAddress) {
      await updateAddress.mutateAsync({ id: editingAddress.id, ...values });
    } else {
      await createAddress.mutateAsync(values);
    }
    setModalOpen(false);
  }

  async function handleDelete(id) {
    await deleteAddress.mutateAsync(id);
    setConfirmingDeleteId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
          Address book
        </h1>
        <Button onClick={openAddModal} className="gap-1.5">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add address
        </Button>
      </div>

      {isLoading && <p className="mt-6 text-sm text-text-muted">Loading addresses…</p>}

      {isError && (
        <p className="mt-6 text-sm text-red-600" role="alert">
          We couldn&apos;t load your addresses. Please try again later.
        </p>
      )}

      {addresses && addresses.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
          <MapPin aria-hidden="true" className="h-8 w-8 text-accent" />
          <p className="mt-3 text-sm text-text-muted">
            You don&apos;t have any saved addresses yet.
          </p>
        </div>
      )}

      {addresses && addresses.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold text-text-primary">{address.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{address.firstline}</p>
                  {address.secondline && (
                    <p className="text-sm text-text-muted">{address.secondline}</p>
                  )}
                  <p className="text-sm text-text-muted">
                    {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                  </p>
                  {address.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                      <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                      {address.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => openEditModal(address)}
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Edit
                </button>

                {confirmingDeleteId === address.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      disabled={deleteAddress.isPending}
                      className="font-semibold text-red-600 hover:text-red-700"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      className="font-semibold text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(address.id)}
                    className="font-semibold text-text-muted hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        address={editingAddress}
        onSubmit={handleSubmit}
        isSubmitting={createAddress.isPending || updateAddress.isPending}
      />
    </div>
  );
}
