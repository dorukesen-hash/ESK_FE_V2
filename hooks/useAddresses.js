'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const ADDRESSES_QUERY_KEY = ['addresses'];

export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/shippingprofiles');
      return data;
    },
  });
}
