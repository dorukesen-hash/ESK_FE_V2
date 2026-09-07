'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateClaim } from '@/hooks/useCreateClaim';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

const schema = yup.object({
  companyName: yup.string(),
  contactName: yup.string().required('Your name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  orderNo: yup.string(),
  description: yup.string().required('Please describe the issue'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function ClaimForm() {
  const user = useAuthStore((state) => state.user);
  const claimMutation = useCreateClaim();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      contactName: user ? `${user.name ?? ''} ${user.surname ?? ''}`.trim() : '',
      email: user?.email ?? '',
    },
  });

  async function onSubmit(values) {
    await claimMutation.mutateAsync(values);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <p className="text-sm text-text-primary">
        Thanks — your claim has been submitted. Our team will follow up by
        email shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="contactName" className="text-sm font-medium text-text-primary">
            Your name
          </label>
          <input id="contactName" {...register('contactName')} className={fieldClass} />
          {errors.contactName && (
            <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="companyName" className="text-sm font-medium text-text-primary">
            Company (optional)
          </label>
          <input id="companyName" {...register('companyName')} className={fieldClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input id="email" type="email" {...register('email')} className={fieldClass} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="orderNo" className="text-sm font-medium text-text-primary">
            Order number (optional)
          </label>
          <input id="orderNo" {...register('orderNo')} className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-text-primary">
          What happened?
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className={fieldClass}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      {claimMutation.isError && (
        <p className="text-sm text-red-600" role="alert">
          {claimMutation.error?.response?.data?.message ??
            "We couldn't submit your claim. Please try again."}
        </p>
      )}

      <Button type="submit" disabled={claimMutation.isPending}>
        {claimMutation.isPending ? 'Submitting…' : 'Submit Claim'}
      </Button>
    </form>
  );
}
