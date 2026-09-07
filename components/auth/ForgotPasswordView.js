'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/useForgotPassword';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
});

export function ForgotPasswordView() {
  const forgotPasswordMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    await forgotPasswordMutation.mutateAsync(values);
  }

  // The API always returns the same generic message whether or not the
  // email exists (a deliberate security choice, not something to work
  // around) - show whatever it sends back rather than a hardcoded string.
  if (forgotPasswordMutation.isSuccess) {
    return (
      <main className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Check your email
        </h1>
        <p className="mt-2 text-text-muted">{forgotPasswordMutation.data.message}</p>
        <Link href="/login" className="mt-6 inline-block text-primary hover:text-primary-hover">
          Back to login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
        Forgot your password?
      </h1>
      <p className="mt-2 text-text-muted">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {forgotPasswordMutation.isPending ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        <Link href="/login" className="text-primary hover:text-primary-hover">
          Back to login
        </Link>
      </p>
    </main>
  );
}
