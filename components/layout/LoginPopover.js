'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useLogin } from '@/hooks/useLogin';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export function LoginPopover() {
  const isOpen = useUIStore((state) => state.isLoginModalOpen);
  const closeLoginModal = useUIStore((state) => state.closeLoginModal);
  const setUser = useAuthStore((state) => state.setUser);
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setServerError(null);
    try {
      const user = await loginMutation.mutateAsync(values);
      setUser(user);
      reset();
      closeLoginModal();
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'Login failed. Please try again.'
      );
    }
  }

  function handleOpenChange(open) {
    if (!open) {
      reset();
      setServerError(null);
      closeLoginModal();
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={handleOpenChange} title="Log in">
      <GoogleLoginButton />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            {...register('email')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="text-sm font-medium text-text-primary">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            {...register('password')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          onClick={() => handleOpenChange(false)}
          className="text-primary transition-colors hover:text-primary-hover"
        >
          Register
        </Link>
      </p>
    </Modal>
  );
}
