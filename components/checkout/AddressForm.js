'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  addressLine: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup
    .string()
    .required('State is required')
    .length(2, 'Use the 2-letter state code'),
  postalCode: yup.string().required('ZIP code is required'),
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

export function AddressForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  addresses = [],
  selectedAddressId = null,
  onSelectAddress,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues });

  // defaultValues arrives undefined on first render for a logged-in shopper
  // (saved addresses load asynchronously) and populated moments later -
  // react-hook-form only reads defaultValues at mount, so re-seeding here
  // is what makes the later value actually reach the form. This is also
  // what re-seeds the form when the shopper picks a different saved
  // address: selecting one is owned entirely by the caller (CheckoutView),
  // which recomputes defaultValues from whichever address is now selected -
  // there is deliberately no second, local reset path here for that, so
  // there's only one place a selection can ever diverge from what's
  // actually filled in. The caller is responsible for keeping this
  // reference stable (useMemo) when nothing meaningful changed, or every
  // unrelated re-render would wipe whatever the shopper had already typed.
  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {addresses.length > 1 && (
        <div>
          <label htmlFor="savedAddress" className="text-sm font-medium text-text-primary">
            Saved address
          </label>
          <select
            id="savedAddress"
            value={selectedAddressId ?? addresses[0].id}
            onChange={(event) => onSelectAddress?.(Number(event.target.value))}
            className={fieldClass}
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field id="firstName" label="First name" register={register('firstName')} error={errors.firstName} />
        <Field id="lastName" label="Last name" register={register('lastName')} error={errors.lastName} />
      </div>
      <Field id="email" label="Email" type="email" register={register('email')} error={errors.email} />
      <Field id="phone" label="Phone" register={register('phone')} error={errors.phone} />
      <Field
        id="addressLine"
        label="Address"
        register={register('addressLine')}
        error={errors.addressLine}
      />
      <div className="grid grid-cols-3 gap-4">
        <Field id="city" label="City" register={register('city')} error={errors.city} />
        <Field
          id="state"
          label="State"
          placeholder="TX"
          register={register('state')}
          error={errors.state}
        />
        <Field
          id="postalCode"
          label="ZIP"
          register={register('postalCode')}
          error={errors.postalCode}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isSubmitting ? 'Getting shipping rates…' : 'Get Shipping Rates'}
      </button>
    </form>
  );
}
