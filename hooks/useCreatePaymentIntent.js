'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async ({ items, shipping }) => {
      const { data } = await api.post('/stripe/create-payment-intent', {
        items,
        shipping,
      });
      return data;
    },
  });
}
