"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StorefrontItemType } from "@/lib/storefront-types";

export type CartCustomDrawingStyle =
  | "CUSTOM_DRAWING_STYLE_1"
  | "CUSTOM_DRAWING_STYLE_2"
  | "CUSTOM_DRAWING_STYLE_3";

export type CartItem = {
  lineId: string;
  productId: string;
  productSlug: string;
  productName: string;
  category: string;
  subcategory: string;
  priceListItemId: string;
  itemType: StorefrontItemType;
  itemTypeLabel: string;
  sizeCm: number;
  sizeLabel: string;
  unitPriceKopecks: number;
  note: string | null;
  quantity: number;
  accent: "violet" | "cyan" | "blue" | "pink";
  coverImage?: string;
  isCustom?: boolean;
  customDrawingStyle?: CartCustomDrawingStyle | null;
  customDesignKey?: string | null;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineId" | "quantity">) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const makeLineId = (item: Omit<CartItem, "lineId" | "quantity">) => {
  const customKey = item.customDrawingStyle
    ? `${item.customDrawingStyle}-${item.customDesignKey ?? "line"}`
    : "catalog";

  return `${item.productId}-${item.priceListItemId}-${customKey}`;
};

export const isCartItem = (item: unknown): item is CartItem => {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Partial<CartItem>;

  return (
    typeof candidate.lineId === "string" &&
    typeof candidate.productId === "string" &&
    typeof candidate.productSlug === "string" &&
    typeof candidate.productName === "string" &&
    typeof candidate.priceListItemId === "string" &&
    typeof candidate.itemType === "string" &&
    typeof candidate.itemTypeLabel === "string" &&
    typeof candidate.sizeCm === "number" &&
    typeof candidate.sizeLabel === "string" &&
    typeof candidate.unitPriceKopecks === "number" &&
    (candidate.note === null || typeof candidate.note === "string") &&
    typeof candidate.quantity === "number" &&
    (candidate.customDrawingStyle === undefined ||
      candidate.customDrawingStyle === null ||
      typeof candidate.customDrawingStyle === "string") &&
    (candidate.customDesignKey === undefined ||
      candidate.customDesignKey === null ||
      typeof candidate.customDesignKey === "string")
  );
};

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
      name: "karma-cart",
      version: 3,
      migrate: (persistedState) => {
        if (
          persistedState &&
          typeof persistedState === "object" &&
          Array.isArray((persistedState as Partial<CartState>).items) &&
          (persistedState as Partial<CartState>).items?.every(isCartItem)
        ) {
          return persistedState as CartState;
        }

        return { items: [] } as unknown as CartState;
      }
    }
  )
);

export const useCartTotals = () => {
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalKopecks = items.reduce((sum, item) => sum + item.unitPriceKopecks * item.quantity, 0);

  return { count, totalKopecks };
};
