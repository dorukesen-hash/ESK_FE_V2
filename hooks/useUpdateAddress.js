'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ADDRESSES_QUERY_KEY } from './useAddresses';

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...address }) => {
      const { data } = await api.put(`/shippingprofiles/${id}`, address);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
