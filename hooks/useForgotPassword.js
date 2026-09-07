'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    },
  });
}
