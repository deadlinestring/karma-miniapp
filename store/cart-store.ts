"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSize, ProductType } from "@/lib/pricing";

export type CartItem = {
  lineId: string;
  productId: string;
  title: string;
  category: string;
  subcategory: string;
  type: ProductType;
  typeLabel: string;
  size: ProductSize;
  price: number;
  quantity: number;
  accent: "violet" | "cyan" | "blue" | "pink";
  isCustom?: boolean;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineId" | "quantity">) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const makeLineId = (item: Omit<CartItem, "lineId" | "quantity">) =>
  `${item.productId}-${item.type}-${item.size}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const lineId = makeLineId(item);
          const existingItem = state.items.find((cartItem) => cartItem.lineId === lineId);

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.lineId === lineId
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem
              )
            };
          }

          return {
            items: [...state.items, { ...item, lineId, quantity: 1 }]
          };
        }),
      increment: (lineId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item
          )
        })),
      decrement: (lineId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.lineId === lineId ? { ...item, quantity: item.quantity - 1 } : item
            )
            .filter((item) => item.quantity > 0)
        })),
      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId)
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: "karma-cart"
    }
  )
);

export const useCartTotals = () => {
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { count, total };
};
