import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItemDTO } from '@/types/dtos';

interface CartState {
  items: CartItemDTO[];
  addItem: (_item: Omit<CartItemDTO, 'quantity'>) => void;
  removeItem: (_productId: string) => void;
  updateQuantity: (_productId: string, _quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);

          if (existingItem) {
            // Increment quantity if mode allows it
            if (item.purchaseMode === 'quantity') {
              const newQuantity = existingItem.quantity + 1;
              const max = item.maxQuantity ?? Infinity;
              if (newQuantity <= max) {
                return {
                  items: state.items.map((i) =>
                    i.productId === item.productId ? { ...i, quantity: newQuantity } : i
                  ),
                };
              }
            }
            return state;
          }

          // Add new item
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId === productId) {
              const max = item.maxQuantity ?? Infinity;
              return { ...item, quantity: Math.min(quantity, max) };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotal: () => {
        const total = get().items.reduce(
          (sum, item) => sum + item.price.amount * item.quantity,
          0
        );
        // Format as EUR (indicative only, BFF recalculates)
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(total);
      },
    }),
    {
      name: 'marrakea-cart',
      skipHydration: false, // We handle hydration via CartHydrationGate
    }
  )
);
