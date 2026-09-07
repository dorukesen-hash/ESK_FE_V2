'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (order) => {
      const { data } = await api.post('/orders', order);
      return data;
    },
  });
}
