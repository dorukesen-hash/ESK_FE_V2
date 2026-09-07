'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      return data;
    },
  });
}
