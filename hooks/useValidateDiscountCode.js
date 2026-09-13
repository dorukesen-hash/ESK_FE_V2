'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useValidateDiscountCode() {
  return useMutation({
    mutationFn: async ({ items, discountCode }) => {
      const { data } = await api.post('/discount-codes/validate', { items, discountCode });
      return data;
    },
  });
}
