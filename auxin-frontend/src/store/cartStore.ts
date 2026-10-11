import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

// ── Helpers (pure, outside store) ─────────────────────────────────────────

function computeCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function computeTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

// ── Store interface ─────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  itemCount: number;
  cartTotal: number;

  addItem: (product: Product, quantity?: number, inventoryId?: number, masterProductId?: number) => void;
  removeItem: (id: number, isInventory?: boolean) => void;
  updateQty: (id: number, quantity: number, isInventory?: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      itemCount: 0,
      cartTotal: 0,

      addItem: (product, quantity = 1, inventoryId, masterProductId) => {
        set((state) => {
          const existing = state.items.find((i) =>
            inventoryId !== undefined
              ? i.inventory_id === inventoryId
              : i.product.id === product.id
          );
          const newItems = existing
            ? state.items.map((i) => {
                const match = inventoryId !== undefined
                  ? i.inventory_id === inventoryId
                  : i.product.id === product.id;
                return match ? { ...i, quantity: i.quantity + quantity } : i;
              })
            : [...state.items, { product, quantity, inventory_id: inventoryId, master_product_id: masterProductId }];
          return {
            items:     newItems,
            itemCount: computeCount(newItems),
            cartTotal: computeTotal(newItems),
          };
        });
      },

      removeItem: (id, isInventory = false) =>
        set((state) => {
          const newItems = state.items.filter((i) =>
            isInventory ? i.inventory_id !== id : i.product.id !== id
          );
          return {
            items:     newItems,
            itemCount: computeCount(newItems),
            cartTotal: computeTotal(newItems),
          };
        }),

      updateQty: (id, quantity, isInventory = false) => {
        if (quantity <= 0) {
          set((state) => {
            const newItems = state.items.filter((i) =>
              isInventory ? i.inventory_id !== id : i.product.id !== id
            );
            return {
              items:     newItems,
              itemCount: computeCount(newItems),
              cartTotal: computeTotal(newItems),
            };
          });
          return;
        }
        set((state) => {
          const newItems = state.items.map((i) => {
            const match = isInventory ? i.inventory_id === id : i.product.id === id;
            return match ? { ...i, quantity } : i;
          });
          return {
            items:     newItems,
            itemCount: computeCount(newItems),
            cartTotal: computeTotal(newItems),
          };
        });
      },

      clearCart: () => set({ items: [], itemCount: 0, cartTotal: 0 }),
    }),
    { name: "auxin_cart" }
  )
);
