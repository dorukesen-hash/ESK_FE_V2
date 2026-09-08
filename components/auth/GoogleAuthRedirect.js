'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function GoogleAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // The Google OAuth callback has already set the same httpOnly cookies
    // a normal /auth/login does by the time the browser lands here -
    // AuthBootstrap (mounted app-wide in app/providers.js) picks up the
    // session from those cookies on its own, and AuthGuard on /account
    // already renders nothing until that resolves, so there is nothing
    // to wait for here beyond handing off the navigation.
    router.replace('/account');
  }, [router]);

  return null;
}
