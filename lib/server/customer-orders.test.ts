import { describe, expect, it, vi } from "vitest";
import {
  getCustomerOrderWithServices,
  getCustomerOrdersWithServices,
  paymentStatusLabel
} from "./customer-orders";

const baseOrder = {
  publicNumber: "KRM-20260601-805754",
  fulfillmentStatus: "IN_WORK",
  paymentStatus: "PENDING",
  totalKopecks: 554000,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-01T11:00:00.000Z"),
  items: [{ productNameSnapshot: "Монки Д. Луффи", quantity: 1 }],
  _count: { items: 1 }
};

const detailOrder = {
  ...baseOrder,
  customerName: "Buyer",
  customerPhone: "+70000000000",
  customerContact: "@buyer",
  comment: "Comment",
  itemsSubtotalKopecks: 499000,
  customDrawingKopecks: 0,
  deliveryMethod: "RUSSIAN_POST",
  deliveryKopecks: 55000,
  discountKopecks: 0,
  deliveryAddress: {
    city: "Барнаул",
    addressLine: "Барнаул, ул. Ленина, д. 1",
    street: "Ленина",
    house: "1",
    apartment: null,
    postalCode: null,
    comment: null
  },
  items: [
    {
      productNameSnapshot: "Монки Д. Луффи",
      productSlugSnapshot: "monki-d-luffi",
      itemTypeSnapshot: "WALL_PANEL",
      itemTypeLabelSnapshot: "Настенная панель",
      sizeCmSnapshot: 30,
      unitPriceKopecks: 499000,
      baseSubtotalKopecks: 499000,
      discountKopecks: 0,
      quantity: 1,
      subtotalKopecks: 499000,
      noteSnapshot: null,
      customDrawingStyle: null,
      customDrawingSurchargeKopecks: 0,
      customImageReviewStatus: "NOT_REQUIRED"
    }
  ]
};

describe("customer orders repository", () => {
  it("returns only orders for the current Telegram user", async () => {
    const db = {
      telegramUser: {
        findUnique: vi.fn().mockResolvedValue({ id: "user-1" })
      },
      order: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([baseOrder])
      }
    };

    const result = await getCustomerOrdersWithServices(
      { id: "12345" },
      {},
      { db: db as any }
    );

    expect(db.telegramUser.findUnique).toHaveBeenCalledWith({
      where: { telegramId: BigInt("12345") },
      select: { id: true }
    });
    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
    expect(result.items[0].publicNumber).toBe("KRM-20260601-805754");
  });

  it("returns an empty list when TelegramUser does not exist yet", async () => {
    const db = {
      telegramUser: {
        findUnique: vi.fn().mockResolvedValue(null)
      },
      order: {
        count: vi.fn(),
        findMany: vi.fn()
      }
    };

    const result = await getCustomerOrdersWithServices(
      { id: "999" },
      {},
      { db: db as any }
    );

    expect(result.items).toEqual([]);
    expect(db.order.findMany).not.toHaveBeenCalled();
  });

  it("returns order detail snapshots for the current user", async () => {
    const db = {
      telegramUser: {
        findUnique: vi.fn().mockResolvedValue({ id: "user-1" })
      },
      order: {
        findFirst: vi.fn().mockResolvedValue(detailOrder)
      }
    };

    const result = await getCustomerOrderWithServices(
      "KRM-20260601-805754",
      { id: "12345" },
      { db: db as any }
    );

    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicNumber: "KRM-20260601-805754", userId: "user-1" }
      })
    );
    expect(result?.items[0]).toMatchObject({
      productName: "Монки Д. Луффи",
      itemTypeLabel: "Настенная панель",
      sizeCm: 30
    });
    expect(result?.deliveryAddress?.city).toBe("Барнаул");
  });

  it("returns null for another user's order without revealing ownership", async () => {
    const db = {
      telegramUser: {
        findUnique: vi.fn().mockResolvedValue({ id: "user-2" })
      },
      order: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    await expect(
      getCustomerOrderWithServices("KRM-20260601-805754", { id: "222" }, { db: db as any })
    ).resolves.toBeNull();
  });

  it("does not require write methods for customer order reads", async () => {
    const db = {
      telegramUser: {
        findUnique: vi.fn().mockResolvedValue({ id: "user-1" })
      },
      order: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([])
      }
    };

    await getCustomerOrdersWithServices({ id: "12345" }, {}, { db: db as any });

    expect("create" in db.order).toBe(false);
    expect("update" in db.order).toBe(false);
    expect("delete" in db.order).toBe(false);
  });

  it("uses customer-friendly payment status labels after YooKassa launch", () => {
    expect(paymentStatusLabel("PENDING")).toBe("Ожидает оплаты");
    expect(paymentStatusLabel("PAID")).toBe("Оплачен");
  });
});
