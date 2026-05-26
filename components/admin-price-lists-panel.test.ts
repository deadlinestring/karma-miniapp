import { describe, expect, it } from "vitest";
import { groupPriceListItems } from "@/lib/admin-price-list-groups";

describe("admin price list UI grouping", () => {
  it("groups the current ten item matrix by item type", () => {
    const groups = groupPriceListItems([
      item("STANDARD", 20, 10),
      item("STANDARD", 25, 20),
      item("PREMIUM", 25, 30),
      item("PREMIUM", 30, 40),
      item("WALL_PANEL", 30, 50),
      item("WALL_PANEL", 35, 60),
      item("WALL_PANEL", 40, 70),
      item("WALL_PANEL", 45, 80),
      item("WALL_PANEL", 50, 90),
      item("WALL_PANEL", 55, 100, "Двойная подсветка сверху и снизу")
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Стандарт", "Премиум", "Настенная панель"]);
    expect(groups[0].items.map((priceItem) => priceItem.sizeCm)).toEqual([20, 25]);
    expect(groups[1].items.map((priceItem) => priceItem.sizeCm)).toEqual([25, 30]);
    expect(groups[2].items.map((priceItem) => priceItem.sizeCm)).toEqual([30, 35, 40, 45, 50, 55]);
    expect(groups[2].items.find((priceItem) => priceItem.sizeCm === 55)?.note).toBe("Двойная подсветка сверху и снизу");
  });
});

function item(itemType: "STANDARD" | "PREMIUM" | "WALL_PANEL", sizeCm: number, sortOrder: number, note: string | null = null) {
  const labels = {
    STANDARD: "Стандарт",
    PREMIUM: "Премиум",
    WALL_PANEL: "Настенная панель"
  };

  return {
    id: `${itemType}-${sizeCm}`,
    itemType,
    itemTypeLabel: labels[itemType],
    sizeCm,
    priceKopecks: 100000,
    priceRubles: 1000,
    note,
    sortOrder,
    isActive: true
  };
}
