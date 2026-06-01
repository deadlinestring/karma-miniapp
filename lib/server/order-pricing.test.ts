import { describe, expect, it } from "vitest";
import {
  calculateOrderPricing,
  NIGHTLIGHT_DELIVERY_KOPECKS,
  WALL_PANEL_DELIVERY_KOPECKS
} from "@/lib/server/order-pricing";

describe("calculateOrderPricing", () => {
  it("uses 450 rub delivery when cart contains only nightlights", () => {
    const result = calculateOrderPricing([
      { itemType: "STANDARD", unitPriceKopecks: 249000, quantity: 1 }
    ]);

    expect(result.deliveryKopecks).toBe(NIGHTLIGHT_DELIVERY_KOPECKS);
    expect(result.totalKopecks).toBe(249000 + 45000);
  });

  it("uses 550 rub delivery when cart contains a wall panel", () => {
    const result = calculateOrderPricing([
      { itemType: "STANDARD", unitPriceKopecks: 249000, quantity: 1 },
      { itemType: "WALL_PANEL", unitPriceKopecks: 499000, quantity: 1 }
    ]);

    expect(result.deliveryKopecks).toBe(WALL_PANEL_DELIVERY_KOPECKS);
  });

  it("does not apply second nightlight discount to a single nightlight", () => {
    const result = calculateOrderPricing([
      { itemType: "PREMIUM", unitPriceKopecks: 549000, quantity: 1 }
    ]);

    expect(result.discountKopecks).toBe(0);
  });

  it("applies 30 percent discount to the cheaper nightlight", () => {
    const result = calculateOrderPricing([
      { itemType: "PREMIUM", unitPriceKopecks: 549000, quantity: 1 },
      { itemType: "STANDARD", unitPriceKopecks: 249000, quantity: 1 }
    ]);

    expect(result.discountKopecks).toBe(74700);
    expect(result.totalKopecks).toBe(549000 + 249000 + 45000 - 74700);
  });

  it("treats quantity as separate eligible nightlight units", () => {
    const result = calculateOrderPricing([
      { itemType: "STANDARD", unitPriceKopecks: 249000, quantity: 2 }
    ]);

    expect(result.discountKopecks).toBe(74700);
  });

  it("does not discount wall panels", () => {
    const result = calculateOrderPricing([
      { itemType: "WALL_PANEL", unitPriceKopecks: 499000, quantity: 2 }
    ]);

    expect(result.discountKopecks).toBe(0);
    expect(result.deliveryKopecks).toBe(55000);
  });

  it("adds custom drawing style surcharge", () => {
    const result = calculateOrderPricing([
      {
        itemType: "STANDARD",
        unitPriceKopecks: 249000,
        quantity: 1,
        customDrawingStyle: "CUSTOM_DRAWING_STYLE_2"
      }
    ]);

    expect(result.customDrawingKopecks).toBe(79000);
    expect(result.totalKopecks).toBe(249000 + 79000 + 45000);
  });

  it("does not include delivery or custom drawing surcharge in the discount base", () => {
    const result = calculateOrderPricing([
      {
        itemType: "STANDARD",
        unitPriceKopecks: 249000,
        quantity: 1,
        customDrawingStyle: "CUSTOM_DRAWING_STYLE_3"
      },
      { itemType: "PREMIUM", unitPriceKopecks: 449000, quantity: 1 }
    ]);

    expect(result.discountKopecks).toBe(74700);
    expect(result.totalKopecks).toBe(249000 + 449000 + 99000 + 45000 - 74700);
  });

  it("charges one drawing surcharge per unique custom design key", () => {
    const result = calculateOrderPricing([
      {
        itemType: "STANDARD",
        unitPriceKopecks: 249000,
        quantity: 1,
        customDrawingStyle: "CUSTOM_DRAWING_STYLE_1",
        customDesignKey: "upload-1"
      },
      {
        itemType: "PREMIUM",
        unitPriceKopecks: 449000,
        quantity: 1,
        customDrawingStyle: "CUSTOM_DRAWING_STYLE_1",
        customDesignKey: "upload-1"
      }
    ]);

    expect(result.customDrawingKopecks).toBe(69000);
  });
});
