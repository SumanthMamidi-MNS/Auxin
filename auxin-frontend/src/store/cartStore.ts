/**
 * store/cartStore.ts
 * Zustand cart store persisted in localStorage.
 *
 * IMPORTANT: count and total are stored as plain number fields in state,
 * NOT as inline functions. Inline functions as selectors cause infinite
 * rerender loops because useCartStore((s) => s.count()) creates a new
 * function call on every render whose result Zustand cannot reliably
 * compare by reference, triggering unbounded subscribe → render cycles.
 */

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
  /** Total number of individual items (sum of quantities). Stable primitive. */
  itemCount: number;
  /** Total price in ₹. Stable primitive. */
  cartTotal: number;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      itemCount: 0,
      cartTotal: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product.id === product.id
          );
          const newItems = existing
            ? state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            : [...state.items, { product, quantity }];
          return {
            items:     newItems,
            itemCount: computeCount(newItems),
            cartTotal: computeTotal(newItems),
          };
        });
      },

      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter(
            (i) => i.product.id !== productId
          );
          return {
            items:     newItems,
            itemCount: computeCount(newItems),
            cartTotal: computeTotal(newItems),
          };
        }),

      updateQty: (productId, quantity) => {
        if (quantity <= 0) {
          set((state) => {
            const newItems = state.items.filter(
              (i) => i.product.id !== productId
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
          const newItems = state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          );
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
