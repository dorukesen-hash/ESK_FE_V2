'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const schema = yup.object({
  title: yup.string().required('Label is required'),
  firstline: yup.string().required('Address is required'),
  secondline: yup.string().nullable(),
  phone: yup.string().nullable(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required').length(2, 'Use the 2-letter state code'),
  zip: yup.string().required('ZIP code is required'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

function Field({ id, label, register, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input id={id} {...register} className={fieldClass} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

export function AddressFormModal({ open, onOpenChange, address, onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        title: address?.title ?? '',
        firstline: address?.firstline ?? '',
        secondline: address?.secondline ?? '',
        phone: address?.phone ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        zip: address?.zip ?? '',
      });
    }
  }, [open, address, reset]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={address ? 'Edit address' : 'Add address'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field id="title" label="Label (e.g. Warehouse)" register={register('title')} error={errors.title} />
        <Field id="firstline" label="Address" register={register('firstline')} error={errors.firstline} />
        <Field
          id="secondline"
          label="Suite / unit (optional)"
          register={register('secondline')}
          error={errors.secondline}
        />
        <Field id="phone" label="Phone (optional)" register={register('phone')} error={errors.phone} />
        <div className="grid grid-cols-3 gap-4">
          <Field id="city" label="City" register={register('city')} error={errors.city} />
          <Field id="state" label="State" placeholder="TX" register={register('state')} error={errors.state} />
          <Field id="zip" label="ZIP" register={register('zip')} error={errors.zip} />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : address ? 'Save changes' : 'Add address'}
        </Button>
      </form>
    </Modal>
  );
}
