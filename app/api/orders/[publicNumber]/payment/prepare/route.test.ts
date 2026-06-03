import { afterEach, describe, expect, it, vi } from "vitest";

describe("customer payment prepare route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/telegram-auth");
    vi.doUnmock("@/lib/server/payment-eligibility");
    vi.doUnmock("@/lib/server/yookassa-config");
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
    vi.doMock("@/lib/server/payment-eligibility", () => ({
      getCustomerOrderPaymentEligibility: vi.fn().mockResolvedValue({
        eligible: false,
        reason: "ORDER_NOT_FOUND",
        message: "Заказ не найден."
      })
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
    vi.doMock("@/lib/server/payment-eligibility", () => ({
      getCustomerOrderPaymentEligibility: vi.fn().mockResolvedValue({
        eligible: false,
        reason: "CUSTOM_IMAGE_PENDING_REVIEW",
        message: "Изображение проверяется администратором."
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
  });

  it("returns provider disabled response for eligible orders without calling YooKassa", async () => {
    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: () => ({ ok: true, user: { id: "12345" } })
    }));
    vi.doMock("@/lib/server/payment-eligibility", () => ({
      getCustomerOrderPaymentEligibility: vi.fn().mockResolvedValue({
        eligible: true,
        reason: "ELIGIBLE",
        message: "Заказ готов к онлайн-оплате."
      })
    }));
    vi.doMock("@/lib/server/yookassa-config", () => ({
      isYooKassaConfigAvailable: vi.fn().mockReturnValue(false)
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
      eligible: true,
      reason: "PROVIDER_ENV_MISSING"
    });
    expect(JSON.stringify(data)).not.toContain("secret");
    expect(JSON.stringify(data)).not.toContain("confirmationUrl");
  });
});
