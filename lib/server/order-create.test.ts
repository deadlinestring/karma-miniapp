import { describe, expect, it, vi } from "vitest";
import { createOrderWithServices, type OrderCreateServices } from "./order-create";

const telegramUser = {
  id: "12345",
  username: "buyer",
  firstName: "Buyer",
  lastName: "Test"
};

const validPayload = {
  deliveryMethod: "RUSSIAN_POST",
  items: [{ productId: "product-1", priceListItemId: "premium-30", quantity: 1 }],
  deliveryAddress: {
    recipientName: "Иван Иванов",
    phone: "+79990000000",
    city: "Барнаул",
    postalCode: "656000",
    street: "Ленина",
    house: "1",
    apartment: "2",
    comment: "Позвонить заранее"
  },
  customerFallbackContact: "@buyer",
  comment: "Комментарий",
  consentPersonalData: true
};

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
          id: "premium-30",
          itemType: "PREMIUM",
          sizeCm: 30,
          priceKopecks: 549000,
          note: null
        }
      ]
    },
    ...overrides
  };
}

function makeServices() {
  const forbiddenPayment = vi.fn(() => {
    throw new Error("payment must not be created");
  });
  const tx = {
    product: {
      findMany: vi.fn().mockResolvedValue([makeProduct()])
    },
    telegramUser: {
      upsert: vi.fn().mockResolvedValue({ id: "telegram-user-1" })
    },
    order: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        publicNumber: "KRM-20260602-ABC123",
        fulfillmentStatus: "NEW",
        paymentStatus: "PENDING"
      })
    },
    payment: {
      create: forbiddenPayment
    }
  };
  const db = {
    $transaction: vi.fn(async (callback) => callback(tx))
  } as unknown as OrderCreateServices["db"];

  return {
    tx,
    forbiddenPayment,
    services: {
      db,
      generatePublicNumber: () => "KRM-20260602-ABC123"
    } satisfies OrderCreateServices
  };
}

describe("createOrderWithServices", () => {
  it("recalculates quote and creates order snapshots inside transaction", async () => {
    const { tx, services, forbiddenPayment } = makeServices();

    const result = await createOrderWithServices(
      { ...validPayload, totalKopecks: 1 },
      telegramUser,
      services
    );

    expect(result.publicNumber).toBe("KRM-20260602-ABC123");
    expect(result.summary.totalKopecks).toBe(549000 + 45000);
    expect(tx.product.findMany).toHaveBeenCalled();
    expect(tx.telegramUser.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { telegramId: BigInt(telegramUser.id) }
      })
    );
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicNumber: "KRM-20260602-ABC123",
          userId: "telegram-user-1",
          customerName: "Иван Иванов",
          customerPhone: "+79990000000",
          paymentProvider: "DEMO",
          paymentStatus: "PENDING",
          fulfillmentStatus: "NEW",
          totalKopecks: 549000 + 45000,
          items: {
            create: [
              expect.objectContaining({
                productId: "product-1",
                priceListItemId: "premium-30",
                productNameSnapshot: "Монки Д. Луффи",
                unitPriceKopecks: 549000,
                customImageReviewStatus: "NOT_REQUIRED",
                subtotalKopecks: 549000
              })
            ]
          },
          deliveryAddress: {
            create: expect.objectContaining({
              city: "Барнаул",
              postalCode: "656000",
              street: "Ленина",
              house: "1"
            })
          }
        })
      })
    );
    expect(forbiddenPayment).not.toHaveBeenCalled();
  });

  it("rejects invalid address before writing", async () => {
    const { tx, services } = makeServices();

    await expect(
      createOrderWithServices(
        { ...validPayload, deliveryAddress: { ...validPayload.deliveryAddress, phone: "bad" } },
        telegramUser,
        services
      )
    ).rejects.toThrow("телефон");

    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects hidden products through quote before order creation", async () => {
    const { tx, services } = makeServices();
    tx.product.findMany.mockResolvedValue([makeProduct({ isActive: false })]);

    await expect(createOrderWithServices(validPayload, telegramUser, services)).rejects.toThrow();

    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("marks custom drawing items as pending review", async () => {
    const { tx, services } = makeServices();

    await createOrderWithServices(
      {
        ...validPayload,
        items: [
          {
            productId: "product-1",
            priceListItemId: "premium-30",
            quantity: 1,
            custom: { drawingStyle: "CUSTOM_DRAWING_STYLE_1", customDesignKey: "design-1" }
          }
        ]
      },
      telegramUser,
      services
    );

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              expect.objectContaining({
                customDrawingStyle: "CUSTOM_DRAWING_STYLE_1",
                customDrawingSurchargeKopecks: 69000,
                customImageReviewStatus: "PENDING_REVIEW"
              })
            ]
          }
        })
      })
    );
  });
});
