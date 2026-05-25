import { describe, expect, it } from "vitest";

describe("main price list data", () => {
  it("contains the stable main price list identity", async () => {
    const { MAIN_PRICE_LIST } = await import("./main-price-list-data.mjs");

    expect(MAIN_PRICE_LIST).toEqual({
      id: "main",
      slug: "main",
      name: "Основной прайс KARMA"
    });
  });

  it("contains exactly ten active matrix items without duplicate physical variants", async () => {
    const { MAIN_PRICE_LIST_ITEMS } = await import("./main-price-list-data.mjs");
    const keys = new Set(MAIN_PRICE_LIST_ITEMS.map((item) => `${item.itemType}:${item.sizeCm}`));

    expect(MAIN_PRICE_LIST_ITEMS).toHaveLength(10);
    expect(keys.size).toBe(10);
  });

  it("stores the approved real prices in kopecks", async () => {
    const { MAIN_PRICE_LIST_ITEMS } = await import("./main-price-list-data.mjs");

    expect(MAIN_PRICE_LIST_ITEMS).toEqual([
      expect.objectContaining({ itemType: "STANDARD", sizeCm: 20, priceKopecks: 249000, note: null }),
      expect.objectContaining({ itemType: "STANDARD", sizeCm: 25, priceKopecks: 339000, note: null }),
      expect.objectContaining({ itemType: "PREMIUM", sizeCm: 25, priceKopecks: 449000, note: null }),
      expect.objectContaining({ itemType: "PREMIUM", sizeCm: 30, priceKopecks: 549000, note: null }),
      expect.objectContaining({ itemType: "WALL_PANEL", sizeCm: 30, priceKopecks: 499000, note: null }),
      expect.objectContaining({ itemType: "WALL_PANEL", sizeCm: 35, priceKopecks: 549000, note: null }),
      expect.objectContaining({ itemType: "WALL_PANEL", sizeCm: 40, priceKopecks: 649000, note: null }),
      expect.objectContaining({ itemType: "WALL_PANEL", sizeCm: 45, priceKopecks: 699000, note: null }),
      expect.objectContaining({ itemType: "WALL_PANEL", sizeCm: 50, priceKopecks: 749000, note: null }),
      expect.objectContaining({
        itemType: "WALL_PANEL",
        sizeCm: 55,
        priceKopecks: 899000,
        note: "Двойная подсветка сверху и снизу"
      })
    ]);
  });
});
