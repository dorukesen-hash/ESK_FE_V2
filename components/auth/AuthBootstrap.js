'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// authStore.isLoading starts `true` and only setUser/clearUser ever flip it
// - nothing previously called either on app start, so AuthGuard-protected
// pages waited on isLoading forever. This checks the httpOnly session cookie
// once per load (api.js's interceptor already handles a 401 by attempting a
// token refresh before this rejects) and settles the store either way.
export function AuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/user/user-details')
      .then(({ data }) => {
        if (!cancelled) setUser(data.userObject);
      })
      .catch(() => {
        if (!cancelled) clearUser();
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, clearUser]);

  return null;
}
