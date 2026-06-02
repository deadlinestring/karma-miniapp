import { afterEach, describe, expect, it, vi } from "vitest";

describe("customer order detail route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/telegram-auth");
    vi.doUnmock("@/lib/server/customer-orders");
  });

  it("rejects order detail without Telegram initData", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/orders/KRM-20260601-805754"), {
      params: { publicNumber: "KRM-20260601-805754" }
    });
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(401);
    expect(body.message).toContain("Telegram");
  });

  it("returns safe 404 for another user's order", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345" }
      })
    }));
    vi.doMock("@/lib/server/customer-orders", () => ({
      getCustomerOrder: vi.fn().mockResolvedValue(null)
    }));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/orders/KRM-20260601-805754", {
        headers: { "X-Telegram-Init-Data": "valid" }
      }),
      { params: { publicNumber: "KRM-20260601-805754" } }
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Заказ не найден.");
  });

  it("returns customer order detail for the current user", async () => {
    const getCustomerOrder = vi.fn().mockResolvedValue({
      publicNumber: "KRM-20260601-805754",
      fulfillmentStatusLabel: "В работе",
      paymentStatusLabel: "Оплата пока не подключена"
    });

    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345" }
      })
    }));
    vi.doMock("@/lib/server/customer-orders", () => ({
      getCustomerOrder
    }));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/orders/KRM-20260601-805754", {
        headers: { "X-Telegram-Init-Data": "valid" }
      }),
      { params: { publicNumber: "KRM-20260601-805754" } }
    );
    const body = (await response.json()) as { ok: boolean; order: { publicNumber: string } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.order.publicNumber).toBe("KRM-20260601-805754");
    expect(getCustomerOrder).toHaveBeenCalledWith("KRM-20260601-805754", { id: "12345" });
  });
});
