import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Transient hand-off from checkout to the order-confirmation page. There is
// no public "get order by number" endpoint to re-fetch from, so the just-
// created order response is stashed here (persisted so a refresh of the
// confirmation page still works) and read once by orderNumber.
export const useLastOrderStore = create(
  persist(
    (set) => ({
      order: null,
      setLastOrder: (order) => set({ order }),
      clear: () => set({ order: null }),
    }),
    { name: 'esk-last-order' }
  )
);
