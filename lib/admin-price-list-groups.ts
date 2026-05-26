import type { StorefrontItemType } from "@/lib/storefront-types";

export type PriceListGroupItem = {
  itemType: StorefrontItemType;
  itemTypeLabel: string;
  sizeCm: number;
  sortOrder: number;
  note: string | null;
};

const itemTypeOrder: StorefrontItemType[] = ["STANDARD", "PREMIUM", "WALL_PANEL"];

export function groupPriceListItems<T extends PriceListGroupItem>(items: T[]) {
  return itemTypeOrder
    .map((itemType) => ({
      itemType,
      label: items.find((item) => item.itemType === itemType)?.itemTypeLabel ?? itemType,
      items: items
        .filter((item) => item.itemType === itemType)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.sizeCm - b.sizeCm)
    }))
    .filter((group) => group.items.length > 0);
}
