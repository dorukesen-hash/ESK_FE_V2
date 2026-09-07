'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      return data.data;
    },
  });
}
