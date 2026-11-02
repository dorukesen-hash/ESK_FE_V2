'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
import { AuthShell } from './AuthShell';
import { AuthDivider } from './AuthDivider';
import { GoogleLoginButton } from './GoogleLoginButton';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function LoginView() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState(null);
  const lastEmail = useLoginMemoryStore((state) => state.lastEmail);
  const lastMethod = useLoginMemoryStore((state) => state.lastMethod);
  const remember = useLoginMemoryStore((state) => state.remember);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  // defaultValues: { email: lastEmail ?? '' } above would read lastEmail at
  // mount only - but zustand's persist middleware rehydrates from
  // localStorage ASYNCHRONOUSLY on the client (so a server-rendered page
  // never mismatches a client that hasn't read localStorage yet), so
  // lastEmail is still null on this component's actual first render in a
  // real browser. Found by testing the real flow (register, log out, come
  // back), not by inspection - a unit test that sets lastEmail before
  // rendering never exercises this timing at all. Setting the field once
  // lastEmail actually arrives is what makes the prefill work outside tests.
  useEffect(() => {
    if (lastEmail) setValue('email', lastEmail);
  }, [lastEmail, setValue]);

  async function onSubmit(values) {
    setServerError(null);
    try {
      const user = await loginMutation.mutateAsync(values);
      remember(values.email, 'password');
      setUser(user);
      router.push('/account');
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'Login failed. Please try again.'
      );
    }
  }

  return (
    <AuthShell
      image="/hero-strapping.jpg"
      alt="Composite and woven strapping rolls with strapping tensioner tools"
      kicker="Welcome Back"
      heading="Pick up right where you left off"
      subtitle="Track orders, reorder in a click, and manage your saved addresses."
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
        Log in
      </h1>
      {lastMethod === 'google' && (
        <p className="mt-2 text-sm text-text-muted">You signed in with Google last time.</p>
      )}

      <div className="mt-8">
        <GoogleLoginButton />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          disabled={loginMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        <Link href="/forgot-password" className="text-primary hover:text-primary-hover">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:text-primary-hover">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
