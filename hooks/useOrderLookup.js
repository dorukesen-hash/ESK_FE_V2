'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useOrderLookup() {
  return useMutation({
    mutationFn: async ({ email, orderNumber }) => {
      const { data } = await api.get('/orders/lookup', {
        params: { email, ...(orderNumber ? { orderNumber } : {}) },
      });
      return data;
    },
  });
}
