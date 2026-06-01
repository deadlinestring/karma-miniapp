import { describe, expect, it, vi } from "vitest";
import { sendOrderCreatedAdminNotifications } from "./order-notifications";

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    publicNumber: "KRM-20260601-128352",
    customerName: "Иван Иванов",
    customerPhone: "+79990000000",
    customerTelegramUsername: "buyer",
    customerContact: "@buyer",
    comment: "Позвонить заранее",
    itemsSubtotalKopecks: 1448000,
    customDrawingKopecks: 0,
    deliveryMethod: "RUSSIAN_POST",
    deliveryKopecks: 55000,
    discountKopecks: 164700,
    totalKopecks: 1338300,
    paymentStatus: "PENDING",
    fulfillmentStatus: "NEW",
    deliveryAddress: {
      city: "Барнаул",
      addressLine: "656000, Барнаул, ул. Ленина, д. 1",
      street: "Ленина",
      house: "1",
      apartment: null,
      postalCode: "656000",
      comment: null
    },
    user: { username: "buyer" },
    items: [
      {
        productNameSnapshot: "Монки Д. Луффи",
        itemTypeSnapshot: "PREMIUM",
        itemTypeLabelSnapshot: "Премиум",
        sizeCmSnapshot: 30,
        unitPriceKopecks: 549000,
        quantity: 1,
        discountKopecks: 164700,
        subtotalKopecks: 384300,
        noteSnapshot: null,
        customDrawingSurchargeKopecks: 0
      },
      {
        productNameSnapshot: "Настенная панель",
        itemTypeSnapshot: "WALL_PANEL",
        itemTypeLabelSnapshot: "Настенная панель",
        sizeCmSnapshot: 55,
        unitPriceKopecks: 899000,
        quantity: 1,
        discountKopecks: 0,
        subtotalKopecks: 899000,
        noteSnapshot: "Двойная подсветка сверху и снизу",
        customDrawingSurchargeKopecks: 0
      }
    ],
    ...overrides
  };
}

function makeServices({
  order = makeOrder(),
  existingLog = null,
  fetchImpl = vi.fn().mockResolvedValue({ ok: true })
}: {
  order?: ReturnType<typeof makeOrder> | null;
  existingLog?: { id: string } | null;
  fetchImpl?: ReturnType<typeof vi.fn>;
} = {}) {
  const db = {
    order: {
      findUnique: vi.fn().mockResolvedValue(order)
    },
    notificationLog: {
      findFirst: vi.fn().mockResolvedValue(existingLog),
      create: vi.fn().mockResolvedValue({ id: "log-1" })
    }
  };

  return {
    db,
    services: {
      db,
      fetch: fetchImpl,
      botToken: "test-bot-token",
      adminIds: "111,222",
      now: () => new Date("2026-06-02T00:00:00.000Z")
    }
  };
}

describe("sendOrderCreatedAdminNotifications", () => {
  it("sends formatted order notification to every configured admin and writes success logs", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const { db, services } = makeServices({ fetchImpl });

    const result = await sendOrderCreatedAdminNotifications("KRM-20260601-128352", services);

    expect(result).toEqual({ attempted: 2, sent: 2, skipped: 0, failed: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.telegram.org/bottest-bot-token/sendMessage"
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string) as { text: string };
    expect(body.text).toContain("🆕 Новый заказ");
    expect(body.text).toContain("KRM-20260601-128352");
    expect(body.text).toContain("Монки Д. Луффи");
    expect(body.text).toContain("Настенная панель");
    expect(body.text).toContain("Оплата пока не подключена");
    expect(body.text).not.toContain("order-1");
    expect(db.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order-1",
          type: "ORDER_CREATED_ADMIN",
          recipientTelegramId: BigInt(111),
          deduplicationKey: "order:new:KRM-20260601-128352:admin:111",
          sentAt: new Date("2026-06-02T00:00:00.000Z")
        })
      })
    );
  });

  it("skips admins that already have a successful notification log", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const { db, services } = makeServices({ existingLog: { id: "sent-log" }, fetchImpl });

    const result = await sendOrderCreatedAdminNotifications("KRM-20260601-128352", services);

    expect(result).toEqual({ attempted: 2, sent: 0, skipped: 2, failed: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(db.notificationLog.create).not.toHaveBeenCalled();
  });

  it("logs failed attempts without blocking notifications for other admins", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    const { db, services } = makeServices({ fetchImpl });

    const result = await sendOrderCreatedAdminNotifications("KRM-20260601-128352", services);

    expect(result).toEqual({ attempted: 2, sent: 1, skipped: 0, failed: 1 });
    expect(db.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order-1",
          type: "ORDER_CREATED_ADMIN_FAILED",
          recipientTelegramId: BigInt(111),
          sentAt: null
        })
      })
    );
    const loggedText = db.notificationLog.create.mock.calls
      .map((call) => `${call[0].data.type}:${call[0].data.deduplicationKey}`)
      .join("\n");
    expect(loggedText).not.toContain("test-bot-token");
  });

  it("does nothing when Telegram notification environment is incomplete", async () => {
    const { services } = makeServices();

    const result = await sendOrderCreatedAdminNotifications("KRM-20260601-128352", {
      ...services,
      botToken: undefined,
      adminIds: undefined
    });

    expect(result).toEqual({ attempted: 0, sent: 0, skipped: 0, failed: 0 });
    expect(services.fetch).not.toHaveBeenCalled();
  });
});
