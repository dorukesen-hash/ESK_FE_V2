import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Lets the login screens prefill the email field and hint which method
// (password vs. Google) worked last time, without needing a server round
// trip - this is purely a per-browser convenience, never used for anything
// security-relevant.
export const useLoginMemoryStore = create(
  persist(
    (set) => ({
      lastEmail: null,
      lastMethod: null,
      remember: (email, method) =>
        set((state) => ({
          lastEmail: email ?? state.lastEmail,
          lastMethod: method,
        })),
    }),
    { name: 'esk-login-memory' }
  )
);
