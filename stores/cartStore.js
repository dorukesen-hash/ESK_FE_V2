import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],

      addItem: (variantId, quantity = 1, isPallet = false) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.variantId === variantId && item.isPallet === isPallet
          );

          if (existingIndex === -1) {
            return { items: [...state.items, { variantId, quantity, isPallet }] };
          }

          const items = [...state.items];
          items[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + quantity,
          };
          return { items };
        }),

      removeItem: (variantId, isPallet = false) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.variantId === variantId && item.isPallet === isPallet)
          ),
        })),

      updateQuantity: (variantId, quantity, isPallet = false) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId && item.isPallet === isPallet
              ? { ...item, quantity }
              : item
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: 'esk-guest-cart' }
  )
);
