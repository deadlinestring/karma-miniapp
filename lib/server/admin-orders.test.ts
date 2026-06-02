import { describe, expect, it, vi } from "vitest";
import {
  getAdminOrderWithServices,
  getAdminOrdersWithServices,
  updateAdminOrderFulfillmentStatusWithServices,
  type AdminOrderServices
} from "./admin-orders";

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    publicNumber: "KRM-20260601-805754",
    fulfillmentStatus: "NEW",
    paymentStatus: "PENDING",
    totalKopecks: 554000,
    deliveryKopecks: 55000,
    discountKopecks: 0,
    customerName: "Иван Иванов",
    customerPhone: "+79990000000",
    customerTelegramUsername: "buyer",
    customerTelegramFirstName: "Buyer",
    customerTelegramLastName: "Test",
    customerContact: "@buyer",
    comment: "Комментарий покупателя",
    adminNotes: null,
    itemsSubtotalKopecks: 499000,
    customDrawingKopecks: 0,
    deliveryMethod: "RUSSIAN_POST",
    createdAt: new Date("2026-06-01T10:00:00.000Z"),
    updatedAt: new Date("2026-06-01T10:05:00.000Z"),
    _count: { items: 1 },
    deliveryAddress: {
      city: "Барнаул",
      addressLine: "656000, Барнаул, ул. Ленина, д. 1",
      street: "Ленина",
      house: "1",
      apartment: null,
      postalCode: "656000",
      comment: null
    },
    items: [
      {
        productNameSnapshot: "Монки Д. Луффи",
        productSlugSnapshot: "monki-d-luffi",
        priceListItemId: "wall-30",
        itemTypeSnapshot: "WALL_PANEL",
        itemTypeLabelSnapshot: "Настенная панель",
        sizeCmSnapshot: 30,
        unitPriceKopecks: 499000,
        baseSubtotalKopecks: 499000,
        customDrawingSurchargeKopecks: 0,
        discountKopecks: 0,
        quantity: 1,
        subtotalKopecks: 499000,
        noteSnapshot: null
      }
    ],
    notificationLogs: [{ type: "ORDER_CREATED_ADMIN", sentAt: new Date("2026-06-01T10:06:00.000Z") }],
    ...overrides
  };
}

function makeServices({
  order = makeOrder(),
  currentStatus = "NEW"
}: {
  order?: ReturnType<typeof makeOrder> | null;
  currentStatus?: string;
} = {}) {
  const db = {
    order: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue(order ? [order] : []),
      findUnique: vi.fn().mockImplementation((args) => {
        if (args.select?.items) {
          return Promise.resolve(order);
        }

        return Promise.resolve(order ? { publicNumber: order.publicNumber, fulfillmentStatus: currentStatus } : null);
      }),
      update: vi.fn().mockResolvedValue({ publicNumber: "KRM-20260601-805754" })
    }
  } as unknown as AdminOrderServices["db"];

  return { services: { db } satisfies AdminOrderServices };
}

describe("admin orders repository", () => {
  it("lists orders with pagination and safe summary fields", async () => {
    const { services } = makeServices();

    const result = await getAdminOrdersWithServices({ page: "2", pageSize: "500" }, services);

    expect(result.pageSize).toBe(50);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        publicNumber: "KRM-20260601-805754",
        fulfillmentStatus: "NEW",
        paymentStatus: "PENDING",
        itemsCount: 1,
        customerDisplayName: "Иван Иванов"
      })
    );
    expect(services.db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 50
      })
    );
  });

  it("filters by fulfillment status and search", async () => {
    const { services } = makeServices();

    await getAdminOrdersWithServices({ status: "NEW", search: "805754" }, services);

    expect(services.db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fulfillmentStatus: "NEW",
          OR: expect.arrayContaining([
            { publicNumber: { contains: "805754", mode: "insensitive" } }
          ])
        })
      })
    );
  });

  it("returns order detail with items, address, totals and notification summary", async () => {
    const { services } = makeServices();

    const detail = await getAdminOrderWithServices("KRM-20260601-805754", services);

    expect(detail.items[0]).toEqual(
      expect.objectContaining({
        productName: "Монки Д. Луффи",
        productSlug: "monki-d-luffi",
        priceListItemId: "wall-30",
        lineTotalKopecks: 499000
      })
    );
    expect(detail.deliveryAddress?.city).toBe("Барнаул");
    expect(detail.notificationSummary.successCount).toBe(1);
    expect(detail.allowedNextStatuses.map((status) => status.value)).toEqual(["IN_WORK", "CANCELLED"]);
  });

  it("updates only fulfillment status for an allowed transition", async () => {
    const { services } = makeServices({ currentStatus: "NEW" });

    await updateAdminOrderFulfillmentStatusWithServices(
      "KRM-20260601-805754",
      { fulfillmentStatus: "IN_WORK" },
      services
    );

    expect(services.db.order.update).toHaveBeenCalledWith({
      where: { publicNumber: "KRM-20260601-805754" },
      data: { fulfillmentStatus: "IN_WORK" },
      select: { publicNumber: true }
    });
    expect(services.db.order.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paymentStatus: expect.anything() }) })
    );
  });

  it("rejects forbidden transitions and payment status changes", async () => {
    const { services } = makeServices({ currentStatus: "COMPLETED" });

    await expect(
      updateAdminOrderFulfillmentStatusWithServices("KRM-20260601-805754", { fulfillmentStatus: "NEW" }, services)
    ).rejects.toThrow("forbidden_status_transition");

    await expect(
      updateAdminOrderFulfillmentStatusWithServices(
        "KRM-20260601-805754",
        { fulfillmentStatus: "IN_WORK", paymentStatus: "PAID" },
        services
      )
    ).rejects.toThrow("forbidden_order_field");

    expect(services.db.order.update).not.toHaveBeenCalled();
  });
});

