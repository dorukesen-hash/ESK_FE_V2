'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/useResetPassword';

const schema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Use at least 8 characters'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function ResetPasswordView({ token }) {
  const resetPasswordMutation = useResetPassword();
  const [serverError, setServerError] = useState(null);
  const [isReset, setIsReset] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setServerError(null);
    try {
      await resetPasswordMutation.mutateAsync({ token, password: values.password });
      setIsReset(true);
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'That reset link is invalid or has expired.'
      );
    }
  }

  if (isReset) {
    return (
      <main className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Password updated
        </h1>
        <p className="mt-2 text-text-muted">You can now log in with your new password.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Go to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
        Reset your password
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            New password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className={fieldClass}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={fieldClass}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {resetPasswordMutation.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </main>
  );
}
