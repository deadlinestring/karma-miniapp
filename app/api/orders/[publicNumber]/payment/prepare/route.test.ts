import { afterEach, describe, expect, it, vi } from "vitest";

describe("customer payment prepare route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/telegram-auth");
    vi.doUnmock("@/lib/server/yookassa-payments");
  });

  it("requires Telegram initData", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/orders/KRM-20260602-8E3EBA/payment/prepare", {
      method: "POST"
    }), { params: { publicNumber: "KRM-20260602-8E3EBA" } });

    expect(response.status).toBe(401);
  });

  it("returns safe 404 for foreign or missing orders", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: () => ({ ok: true, user: { id: "12345" } })
    }));
    vi.doMock("@/lib/server/yookassa-payments", () => ({
      prepareCustomerYooKassaPayment: vi.fn().mockResolvedValue({ ok: false, reason: "ORDER_NOT_FOUND" })
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/orders/KRM-20260602-8E3EBA/payment/prepare", {
      method: "POST",
      headers: { "X-Telegram-Init-Data": "safe" }
    }), { params: { publicNumber: "KRM-20260602-8E3EBA" } });

    expect(response.status).toBe(404);
  });

  it("blocks pending custom review without creating provider payments", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: () => ({ ok: true, user: { id: "12345" } })
    }));
    vi.doMock("@/lib/server/yookassa-payments", () => ({
      prepareCustomerYooKassaPayment: vi.fn().mockResolvedValue({
        ok: true,
        payment: {
          provider: "YOOKASSA",
          providerEnabled: false,
          eligible: false,
          reason: "CUSTOM_IMAGE_PENDING_REVIEW",
          message: "Изображение проверяется администратором."
        }
      })
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/orders/KRM-20260602-8E3EBA/payment/prepare", {
      method: "POST",
      headers: { "X-Telegram-Init-Data": "safe" }
    }), { params: { publicNumber: "KRM-20260602-8E3EBA" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.payment).toMatchObject({
      provider: "YOOKASSA",
      providerEnabled: false,
      eligible: false,
      reason: "CUSTOM_IMAGE_PENDING_REVIEW"
    });
    expect(JSON.stringify(data)).not.toContain("confirmationUrl");
  });

  it("returns confirmationUrl for eligible prepared payments", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: () => ({ ok: true, user: { id: "12345" } })
    }));
    vi.doMock("@/lib/server/yookassa-payments", () => ({
      prepareCustomerYooKassaPayment: vi.fn().mockResolvedValue({
        ok: true,
        payment: {
          provider: "YOOKASSA",
          providerEnabled: true,
          eligible: true,
          reused: false,
          paymentId: "payment-1",
          providerPaymentId: "yk-1",
          status: "PENDING",
          confirmationUrl: "https://yookassa.test/confirm"
        }
      })
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/orders/KRM-20260602-8E3EBA/payment/prepare", {
      method: "POST",
      headers: { "X-Telegram-Init-Data": "safe" }
    }), { params: { publicNumber: "KRM-20260602-8E3EBA" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.payment).toMatchObject({
      providerEnabled: true,
      eligible: true,
      confirmationUrl: "https://yookassa.test/confirm"
    });
    expect(JSON.stringify(data)).not.toContain("secret");
  });

  it("returns a safe error when provider creation fails", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: () => ({ ok: true, user: { id: "12345" } })
    }));
    vi.doMock("@/lib/server/yookassa-payments", () => ({
      prepareCustomerYooKassaPayment: vi.fn().mockRejectedValue(new Error("yookassa_payment_create_failed"))
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/orders/KRM-20260602-8E3EBA/payment/prepare", {
      method: "POST",
      headers: { "X-Telegram-Init-Data": "safe" }
    }), { params: { publicNumber: "KRM-20260602-8E3EBA" } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain("Не удалось подготовить оплату");
    expect(JSON.stringify(data)).not.toContain("yookassa_payment_create_failed");
  });
});
