import { describe, expect, it, vi } from "vitest";
import {
  buildReturnUrl,
  createYooKassaPayment,
  formatKopecksForYooKassa,
  mapYooKassaStatus
} from "./yookassa-client";

const config = {
  shopId: "shop-123",
  secretKey: "super-secret",
  returnUrl: "https://karma.example/orders/payment-return",
  webhookSecret: null
};

describe("YooKassa client", () => {
  it("formats kopecks as rubles with two decimals", () => {
    expect(formatKopecksForYooKassa(693000)).toBe("6930.00");
    expect(formatKopecksForYooKassa(99000)).toBe("990.00");
    expect(() => formatKopecksForYooKassa(0)).toThrow("invalid_yookassa_amount");
  });

  it("builds a return URL with order public number", () => {
    expect(buildReturnUrl(config.returnUrl, "KRM-20260602-8E3EBA")).toBe(
      "https://karma.example/orders/payment-return?order=KRM-20260602-8E3EBA"
    );
  });

  it("creates a redirect payment with auth and idempotence headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "yk-payment-1",
          status: "pending",
          confirmation: { confirmation_url: "https://yookassa.test/confirm" }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await createYooKassaPayment(
      {
        publicNumber: "KRM-20260602-8E3EBA",
        amountKopecks: 693000,
        idempotencyKey: "karma-KRM-20260602-8E3EBA-payment-v1"
      },
      config,
      fetchMock
    );

    expect(result).toEqual({
      providerPaymentId: "yk-payment-1",
      providerStatus: "pending",
      status: "PENDING",
      confirmationUrl: "https://yookassa.test/confirm"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.yookassa.ru/v3/payments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          "Content-Type": "application/json",
          "Idempotence-Key": "karma-KRM-20260602-8E3EBA-payment-v1"
        })
      })
    );

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      amount: { value: "6930.00", currency: "RUB" },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: "https://karma.example/orders/payment-return?order=KRM-20260602-8E3EBA"
      },
      description: "Заказ KRM-20260602-8E3EBA",
      metadata: { orderPublicNumber: "KRM-20260602-8E3EBA" },
      save_payment_method: false
    });
    expect(JSON.stringify(result)).not.toContain(config.secretKey);
  });

  it("throws safe errors for provider failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ type: "error", description: "provider details" }), { status: 500 })
    );

    await expect(
      createYooKassaPayment(
        {
          publicNumber: "KRM-20260602-8E3EBA",
          amountKopecks: 693000,
          idempotencyKey: "key"
        },
        config,
        fetchMock
      )
    ).rejects.toThrow("yookassa_payment_create_failed");
  });

  it("maps provider statuses without marking pending payments as paid", () => {
    expect(mapYooKassaStatus("pending")).toBe("PENDING");
    expect(mapYooKassaStatus("waiting_for_capture")).toBe("PENDING");
    expect(mapYooKassaStatus("succeeded")).toBe("PAID");
    expect(mapYooKassaStatus("canceled")).toBe("CANCELLED");
  });
});
