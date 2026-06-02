import { afterEach, describe, expect, it, vi } from "vitest";

describe("orders create route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/telegram-auth");
    vi.doUnmock("@/lib/server/order-create");
    vi.doUnmock("@/lib/server/customer-orders");
  });

  it("rejects customer order list without Telegram initData", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/orders"));
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(401);
    expect(body.message).toContain("Telegram");
  });

  it("returns customer orders for a valid Telegram user", async () => {
    const getCustomerOrders = vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1
    });

    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345", username: "buyer" }
      })
    }));
    vi.doMock("@/lib/server/customer-orders", () => ({
      getCustomerOrders
    }));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/orders?page=2", {
        headers: { "X-Telegram-Init-Data": "valid" }
      })
    );
    const body = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(getCustomerOrders).toHaveBeenCalledWith(
      { id: "12345", username: "buyer" },
      { page: "2", pageSize: null }
    );
  });

  it("rejects order creation without Telegram initData", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: "RUSSIAN_POST", items: [] })
      })
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(401);
    expect(body.message).toContain("Telegram");
  });

  it("rejects invalid Telegram initData", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({ ok: false, reason: "invalid_signature" })
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": "invalid" },
        body: JSON.stringify({ deliveryMethod: "RUSSIAN_POST", items: [] })
      })
    );

    expect(response.status).toBe(401);
  });

  it("creates an order for a valid Telegram user", async () => {
    const createOrder = vi.fn().mockResolvedValue({
      publicNumber: "KRM-20260602-ABC123",
      status: "NEW",
      paymentStatus: "PENDING",
      summary: { totalKopecks: 594000 },
      message: "Заказ создан."
    });

    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345", username: "buyer" }
      })
    }));
    vi.doMock("@/lib/server/order-create", () => ({
      OrderCreateError: class MockOrderCreateError extends Error {},
      TELEGRAM_ORDER_REQUIRED_MESSAGE: "Откройте магазин внутри Telegram, чтобы оформить заказ.",
      createOrder
    }));

    const { POST } = await import("./route");
    const payload = { deliveryMethod: "RUSSIAN_POST", items: [{ productId: "p1" }] };
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": "valid" },
        body: JSON.stringify(payload)
      })
    );
    const body = (await response.json()) as {
      ok: boolean;
      order: { publicNumber: string };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.order.publicNumber).toBe("KRM-20260602-ABC123");
    expect(createOrder).toHaveBeenCalledWith(payload, { id: "12345", username: "buyer" });
  });

  it("returns safe validation errors from order service", async () => {
    class MockOrderCreateError extends Error {}
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345" }
      })
    }));
    vi.doMock("@/lib/server/order-create", () => ({
      OrderCreateError: MockOrderCreateError,
      TELEGRAM_ORDER_REQUIRED_MESSAGE: "Откройте магазин внутри Telegram, чтобы оформить заказ.",
      createOrder: vi.fn().mockRejectedValue(new MockOrderCreateError("Заполните адрес доставки."))
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": "valid" },
        body: JSON.stringify({ deliveryMethod: "RUSSIAN_POST", items: [] })
      })
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Заполните адрес доставки.");
  });

  it("returns safe validation errors from quote recalculation", async () => {
    class MockOrderQuoteError extends Error {}
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345" }
      })
    }));
    vi.doMock("@/lib/server/order-create", () => ({
      OrderCreateError: class MockOrderCreateError extends Error {},
      TELEGRAM_ORDER_REQUIRED_MESSAGE: "Откройте магазин внутри Telegram, чтобы оформить заказ.",
      createOrder: vi.fn().mockRejectedValue(new MockOrderQuoteError("Товар недоступен для заказа."))
    }));
    vi.doMock("@/lib/server/order-quote", () => ({
      OrderQuoteError: MockOrderQuoteError
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": "valid" },
        body: JSON.stringify({ deliveryMethod: "RUSSIAN_POST", items: [] })
      })
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Товар недоступен для заказа.");
  });
});
