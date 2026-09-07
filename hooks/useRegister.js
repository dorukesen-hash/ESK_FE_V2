'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRegister() {
  return useMutation({
    mutationFn: async ({ name, surname, email, password }) => {
      const { data } = await api.post('/auth/register', {
        name,
        surname,
        email,
        password,
      });
      return data;
    },
  });
}
