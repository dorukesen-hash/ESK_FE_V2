'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/useRegister';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
import { AuthShell } from './AuthShell';
import { AuthDivider } from './AuthDivider';
import { GoogleLoginButton } from './GoogleLoginButton';

const schema = yup.object({
  name: yup.string().required('First name is required'),
  surname: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Use at least 8 characters'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function RegisterView() {
  const router = useRouter();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const setUser = useAuthStore((state) => state.setUser);
  const remember = useLoginMemoryStore((state) => state.remember);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setServerError(null);
    try {
      await registerMutation.mutateAsync(values);
      // The registration endpoint only creates the account - it doesn't set
      // a session (ESK_API's POST /auth/register returns a bare message,
      // no cookies). Logging in immediately with the credentials the user
      // just typed, rather than sending them to /login to retype them,
      // matches how every other account-creation flow in this app treats
      // "created" as "signed in."
      const user = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      // This auto-login counts as a login for login-memory purposes too -
      // registration is often someone's very first contact with the site,
      // so this is exactly the visitor the remember-login feature exists
      // to help on their next visit.
      remember(values.email, 'password');
      setUser(user);
      router.push('/account');
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'Registration failed. Please try again.'
      );
    }
  }

  return (
    <AuthShell
      image="/hero-product-range.webp"
      alt="ESK Packaging product range: branded tape, corrugated boxes, strapping coils, stretch film and dispenser carts"
      kicker="Full Product Range"
      heading="Everything your warehouse needs, in one order"
      subtitle="Boxes, tape, film and equipment, stocked and ready to ship."
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
        Create an account
      </h1>

      <div className="mt-8">
        <GoogleLoginButton />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="text-sm font-medium text-text-primary">
            First name
          </label>
          <input id="name" {...register('name')} className={fieldClass} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="surname" className="text-sm font-medium text-text-primary">
            Last name
          </label>
          <input id="surname" {...register('surname')} className={fieldClass} />
          {errors.surname && (
            <p className="mt-1 text-xs text-red-600">{errors.surname.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input id="email" type="email" {...register('email')} className={fieldClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            Password
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

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={registerMutation.isPending || loginMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {registerMutation.isPending || loginMutation.isPending
            ? 'Creating account…'
            : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-hover">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
