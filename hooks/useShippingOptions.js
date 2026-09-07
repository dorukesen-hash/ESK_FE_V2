'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useShippingOptions() {
  return useMutation({
    mutationFn: async ({ recipient, items }) => {
      const { data } = await api.post('/services/combined-shipping-options', {
        recipient,
        items,
      });
      return data.options ?? [];
    },
  });
}
