import { describe, expect, it, vi } from "vitest";
import { quoteOrderWithServices, type OrderQuoteServices } from "./order-quote";

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    name: "Монки Д. Луффи",
    slug: "monki-d-luffi",
    productType: "REGULAR",
    isActive: true,
    subcategory: {
      isActive: true,
      category: { isActive: true }
    },
    images: [{ id: "cover-1" }],
    priceList: {
      id: "main",
      isActive: true,
      items: [
        {
          id: "standard-20",
          itemType: "STANDARD",
          sizeCm: 20,
          priceKopecks: 249000,
          note: null
        },
        {
          id: "premium-30",
          itemType: "PREMIUM",
          sizeCm: 30,
          priceKopecks: 549000,
          note: null
        },
        {
          id: "wall-55",
          itemType: "WALL_PANEL",
          sizeCm: 55,
          priceKopecks: 899000,
          note: "Двойная подсветка сверху и снизу"
        }
      ]
    },
    ...overrides
  };
}

function makeServices(products = [makeProduct()]) {
  const forbiddenWrite = vi.fn(() => {
    throw new Error("write method must not be called");
  });
  const db = {
    product: {
      findMany: vi.fn().mockResolvedValue(products),
      create: forbiddenWrite,
      update: forbiddenWrite,
      upsert: forbiddenWrite,
      delete: forbiddenWrite,
      deleteMany: forbiddenWrite
    }
  } as unknown as OrderQuoteServices["db"];

  return { db, forbiddenWrite, services: { db } };
}

const basePayload = {
  deliveryMethod: "RUSSIAN_POST",
  items: [{ productId: "product-1", priceListItemId: "premium-30", quantity: 1 }]
};

describe("quoteOrderWithServices", () => {
  it("returns server prices from PriceListItem", async () => {
    const { services } = makeServices();

    const quote = await quoteOrderWithServices(
      {
        ...basePayload,
        items: [
          {
            productId: "product-1",
            priceListItemId: "premium-30",
            quantity: 1,
            unitPriceKopecks: 1,
            itemType: "STANDARD"
          }
        ]
      },
      services
    );

    expect(quote.items[0].unitPriceKopecks).toBe(549000);
    expect(quote.summary.totalKopecks).toBe(549000 + 45000);
  });

  it("rejects empty items", async () => {
    await expect(
      quoteOrderWithServices({ deliveryMethod: "RUSSIAN_POST", items: [] }, makeServices().services)
    ).rejects.toThrow("Корзина пуста");
  });

  it("rejects invalid quantity", async () => {
    await expect(
      quoteOrderWithServices(
        { deliveryMethod: "RUSSIAN_POST", items: [{ productId: "product-1", priceListItemId: "premium-30", quantity: 0 }] },
        makeServices().services
      )
    ).rejects.toThrow("Количество");
  });

  it("rejects unsupported delivery method", async () => {
    await expect(
      quoteOrderWithServices({ ...basePayload, deliveryMethod: "PICKUP" }, makeServices().services)
    ).rejects.toThrow("Почтой России");
  });

  it("rejects hidden products", async () => {
    await expect(
      quoteOrderWithServices(basePayload, makeServices([makeProduct({ isActive: false })]).services)
    ).rejects.toThrow("Товар недоступен");
  });

  it("rejects inactive category or subcategory", async () => {
    await expect(
      quoteOrderWithServices(
        basePayload,
        makeServices([
          makeProduct({ subcategory: { isActive: false, category: { isActive: true } } })
        ]).services
      )
    ).rejects.toThrow("подкатегория");

    await expect(
      quoteOrderWithServices(
        basePayload,
        makeServices([
          makeProduct({ subcategory: { isActive: true, category: { isActive: false } } })
        ]).services
      )
    ).rejects.toThrow("категория");
  });

  it("rejects price list items outside the product price list", async () => {
    await expect(
      quoteOrderWithServices(
        { ...basePayload, items: [{ productId: "product-1", priceListItemId: "other-item", quantity: 1 }] },
        makeServices().services
      )
    ).rejects.toThrow("вариант товара");
  });

  it("rejects products without active price list or cover", async () => {
    await expect(
      quoteOrderWithServices(basePayload, makeServices([makeProduct({ priceList: { id: "main", isActive: false, items: [] } })]).services)
    ).rejects.toThrow("активный прайс");

    await expect(
      quoteOrderWithServices(basePayload, makeServices([makeProduct({ images: [] })]).services)
    ).rejects.toThrow("временно недоступен");
  });

  it("calculates discount, wall-panel delivery and custom drawing surcharge", async () => {
    const { services } = makeServices([makeProduct({ productType: "CUSTOM", images: [] })]);

    const quote = await quoteOrderWithServices(
      {
        deliveryMethod: "RUSSIAN_POST",
        items: [
          {
            productId: "product-1",
            priceListItemId: "standard-20",
            quantity: 1,
            custom: {
              drawingStyle: "CUSTOM_DRAWING_STYLE_1",
              customDesignKey: "custom-orders/12345/design-1.png",
              customImageStoragePath: "custom-orders/12345/design-1.png"
            }
          },
          {
            productId: "product-1",
            priceListItemId: "premium-30",
            quantity: 1,
            custom: {
              drawingStyle: "CUSTOM_DRAWING_STYLE_1",
              customDesignKey: "custom-orders/12345/design-1.png",
              customImageStoragePath: "custom-orders/12345/design-1.png"
            }
          },
          {
            productId: "product-1",
            priceListItemId: "wall-55",
            quantity: 1,
            custom: {
              drawingStyle: "CUSTOM_DRAWING_STYLE_1",
              customDesignKey: "custom-orders/12345/design-1.png",
              customImageStoragePath: "custom-orders/12345/design-1.png",
              customImageFileName: "design-1.png"
            }
          }
        ]
      },
      services
    );

    expect(quote.summary.deliveryAmountKopecks).toBe(55000);
    expect(quote.summary.discountAmountKopecks).toBe(74700);
    expect(quote.summary.customDrawingTotalKopecks).toBe(69000);
    expect(quote.items[2].note).toBe("Двойная подсветка сверху и снизу");
  });

  it("discounts the cheapest unit when a premium nightlight is ordered with a wall panel", async () => {
    const quote = await quoteOrderWithServices(
      {
        deliveryMethod: "RUSSIAN_POST",
        items: [
          { productId: "product-1", priceListItemId: "premium-30", quantity: 1 },
          { productId: "product-1", priceListItemId: "wall-55", quantity: 1 }
        ]
      },
      makeServices().services
    );

    expect(quote.summary.itemsSubtotalKopecks).toBe(1448000);
    expect(quote.summary.discountAmountKopecks).toBe(164700);
    expect(quote.summary.deliveryAmountKopecks).toBe(55000);
    expect(quote.summary.totalKopecks).toBe(1338300);
  });

  it("does not double-charge repeated custom design key", async () => {
    const quote = await quoteOrderWithServices(
      {
        deliveryMethod: "RUSSIAN_POST",
        items: [
          {
            productId: "product-1",
            priceListItemId: "standard-20",
            quantity: 1,
            custom: {
              drawingStyle: "CUSTOM_DRAWING_STYLE_2",
              customDesignKey: "custom-orders/12345/same-design.png",
              customImageStoragePath: "custom-orders/12345/same-design.png"
            }
          },
          {
            productId: "product-1",
            priceListItemId: "premium-30",
            quantity: 1,
            custom: {
              drawingStyle: "CUSTOM_DRAWING_STYLE_2",
              customDesignKey: "custom-orders/12345/same-design.png",
              customImageStoragePath: "custom-orders/12345/same-design.png"
            }
          }
        ]
      },
      makeServices([makeProduct({ productType: "CUSTOM", images: [] })]).services
    );

    expect(quote.summary.customDrawingTotalKopecks).toBe(79000);
  });

  it("rejects custom product quote without uploaded image", async () => {
    await expect(
      quoteOrderWithServices(
        {
          deliveryMethod: "RUSSIAN_POST",
          items: [
            {
              productId: "product-1",
              priceListItemId: "premium-30",
              quantity: 1,
              custom: {
                drawingStyle: "CUSTOM_DRAWING_STYLE_1",
                customDesignKey: "design-1"
              }
            }
          ]
        },
        makeServices([makeProduct({ productType: "CUSTOM", images: [] })]).services
      )
    ).rejects.toThrow("изображение");
  });

  it("rejects custom drawing payload for a regular product", async () => {
    await expect(
      quoteOrderWithServices(
        {
          deliveryMethod: "RUSSIAN_POST",
          items: [
            {
              productId: "product-1",
              priceListItemId: "premium-30",
              quantity: 1,
              custom: {
                drawingStyle: "CUSTOM_DRAWING_STYLE_1",
                customDesignKey: "custom-orders/12345/design-1.png",
                customImageStoragePath: "custom-orders/12345/design-1.png"
              }
            }
          ]
        },
        makeServices().services
      )
    ).rejects.toThrow("Свой дизайн");
  });

  it("does not call write methods", async () => {
    const { services, forbiddenWrite } = makeServices();

    await quoteOrderWithServices(basePayload, services);

    expect(forbiddenWrite).not.toHaveBeenCalled();
  });
});
