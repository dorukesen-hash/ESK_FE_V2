'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const ACCOUNT_INVOICES_QUERY_KEY = ['account-invoices'];

export function useAccountInvoices() {
  return useQuery({
    queryKey: ACCOUNT_INVOICES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/account/invoices');
      return data.invoices;
    },
  });
}
