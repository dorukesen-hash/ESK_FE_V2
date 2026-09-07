'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/logout');
      return data;
    },
  });
}
