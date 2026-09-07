'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateClaim() {
  return useMutation({
    mutationFn: async (claim) => {
      const { data } = await api.post('/claims', claim);
      return data;
    },
  });
}
