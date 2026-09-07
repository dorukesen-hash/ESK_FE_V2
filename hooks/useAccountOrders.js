'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const ACCOUNT_ORDERS_QUERY_KEY = ['account-orders'];

export function useAccountOrders() {
  return useQuery({
    queryKey: ACCOUNT_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/account/orders');
      return data.orders;
    },
  });
}
