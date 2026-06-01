import { describe, expect, it } from "vitest";
import { isCartItem } from "./cart-store";

describe("cart snapshot compatibility", () => {
  it("accepts the new price list item snapshot with note", () => {
    expect(
      isCartItem({
        lineId: "product-1-pli-wall-55",
        productId: "product-1",
        productSlug: "naruto-uzumaki",
        productName: "Наруто Узумаки",
        category: "Аниме",
        subcategory: "Наруто",
        priceListItemId: "pli-wall-55",
        itemType: "WALL_PANEL",
        itemTypeLabel: "Настенная панель",
        sizeCm: 55,
        sizeLabel: "55 см",
        unitPriceKopecks: 899000,
        note: "Двойная подсветка сверху и снизу",
        quantity: 1,
        accent: "violet",
        customDrawingStyle: null,
        customDesignKey: null
      })
    ).toBe(true);
  });

  it("accepts forward-compatible custom drawing metadata", () => {
    expect(
      isCartItem({
        lineId: "product-1-pli-standard-20-CUSTOM_DRAWING_STYLE_1-design-1",
        productId: "product-1",
        productSlug: "custom",
        productName: "Свой дизайн",
        category: "Идея",
        subcategory: "Свой дизайн",
        priceListItemId: "pli-standard-20",
        itemType: "STANDARD",
        itemTypeLabel: "Стандарт",
        sizeCm: 20,
        sizeLabel: "20 см",
        unitPriceKopecks: 249000,
        note: null,
        quantity: 1,
        accent: "cyan",
        customDrawingStyle: "CUSTOM_DRAWING_STYLE_1",
        customDesignKey: "design-1"
      })
    ).toBe(true);
  });

  it("rejects legacy cart items that do not contain priceListItemId", () => {
    expect(
      isCartItem({
        lineId: "product-1-WALL_PANEL-55",
        productId: "product-1",
        productSlug: "naruto-uzumaki",
        productName: "Наруто Узумаки",
        itemType: "WALL_PANEL",
        itemTypeLabel: "Настенная панель",
        sizeCm: 55,
        sizeLabel: "55 см",
        unitPriceKopecks: 899000,
        quantity: 1
      })
    ).toBe(false);
  });
});
