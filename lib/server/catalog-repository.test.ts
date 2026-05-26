import { describe, expect, it } from "vitest";
import { mapProductRecord } from "./catalog-repository";

const note = "Двойная подсветка сверху и снизу";

const priceItems = [
  { id: "pli-standard-20", itemType: "STANDARD", sizeCm: 20, priceKopecks: 249000, note: null, sortOrder: 10 },
  { id: "pli-standard-25", itemType: "STANDARD", sizeCm: 25, priceKopecks: 339000, note: null, sortOrder: 20 },
  { id: "pli-premium-25", itemType: "PREMIUM", sizeCm: 25, priceKopecks: 449000, note: null, sortOrder: 30 },
  { id: "pli-premium-30", itemType: "PREMIUM", sizeCm: 30, priceKopecks: 549000, note: null, sortOrder: 40 },
  { id: "pli-wall-30", itemType: "WALL_PANEL", sizeCm: 30, priceKopecks: 499000, note: null, sortOrder: 50 },
  { id: "pli-wall-35", itemType: "WALL_PANEL", sizeCm: 35, priceKopecks: 549000, note: null, sortOrder: 60 },
  { id: "pli-wall-40", itemType: "WALL_PANEL", sizeCm: 40, priceKopecks: 649000, note: null, sortOrder: 70 },
  { id: "pli-wall-45", itemType: "WALL_PANEL", sizeCm: 45, priceKopecks: 699000, note: null, sortOrder: 80 },
  { id: "pli-wall-50", itemType: "WALL_PANEL", sizeCm: 50, priceKopecks: 749000, note: null, sortOrder: 90 },
  { id: "pli-wall-55", itemType: "WALL_PANEL", sizeCm: 55, priceKopecks: 899000, note, sortOrder: 100 }
];

function makeProductRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    slug: "naruto-uzumaki",
    name: "Наруто Узумаки",
    description: "Тестовый товар",
    productType: "REGULAR",
    isFeatured: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    subcategory: {
      id: "subcategory-1",
      categoryId: "category-1",
      name: "Наруто",
      slug: "naruto",
      coverImageUrl: null,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      category: {
        id: "category-1",
        name: "Аниме",
        slug: "anime",
        coverImageUrl: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z")
      }
    },
    images: [
      {
        id: "image-1",
        productId: "product-1",
        url: "/images/mock/product-violet.svg",
        storagePath: "/images/mock/product-violet.svg",
        altText: null,
        isCover: true,
        sortOrder: 1,
        createdAt: new Date("2026-01-01T00:00:00.000Z")
      }
    ],
    priceList: {
      id: "main",
      isActive: true,
      items: priceItems
    },
    ...overrides
  } as Parameters<typeof mapProductRecord>[0];
}

describe("storefront price list mapper", () => {
  it("maps active PriceListItem rows as the only storefront variants", () => {
    const product = mapProductRecord(makeProductRecord());

    expect(product.variants).toHaveLength(10);
    expect(product.variants[0]).toEqual(
      expect.objectContaining({
        priceListItemId: "pli-standard-20",
        itemType: "STANDARD",
        sizeCm: 20,
        priceKopecks: 249000
      })
    );
  });

  it("does not fall back to legacy ProductVariant when active price list is missing", () => {
    const product = mapProductRecord(
      makeProductRecord({
        priceList: null,
        variants: [{ id: "legacy", itemType: "STANDARD", sizeCm: 30, priceKopecks: 429000 }]
      } as Record<string, unknown>)
    );

    expect(product.variants).toEqual([]);
    expect(product.isOrderAvailable).toBe(false);
    expect(product.minPriceKopecks).toBe(0);
  });

  it("exposes the real matrix sizes and the wall panel note", () => {
    const product = mapProductRecord(makeProductRecord());
    const standardSizes = product.variants.filter((variant) => variant.itemType === "STANDARD").map((variant) => variant.sizeCm);
    const premiumSizes = product.variants.filter((variant) => variant.itemType === "PREMIUM").map((variant) => variant.sizeCm);
    const wallPanelSizes = product.variants.filter((variant) => variant.itemType === "WALL_PANEL").map((variant) => variant.sizeCm);

    expect(standardSizes).toEqual([20, 25]);
    expect(premiumSizes).toEqual([25, 30]);
    expect(wallPanelSizes).toEqual([30, 35, 40, 45, 50, 55]);
    expect(product.variants.find((variant) => variant.itemType === "WALL_PANEL" && variant.sizeCm === 55)?.note).toBe(note);
  });

  it("calculates minPriceKopecks from PriceListItem rows", () => {
    const product = mapProductRecord(makeProductRecord());

    expect(product.minPriceKopecks).toBe(249000);
    expect(product.isOrderAvailable).toBe(true);
  });
});
