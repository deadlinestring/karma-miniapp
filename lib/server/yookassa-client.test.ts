import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildReturnUrl,
  createYooKassaPayment,
  formatKopecksForYooKassa,
  mapYooKassaStatus,
  YooKassaProviderError
} from "./yookassa-client";

const config = {
  shopId: "shop-123",
  secretKey: "super-secret",
  returnUrl: "https://karma.example/orders/payment-return",
  webhookSecret: null,
  vatCode: 1
};

const receipt = {
  customer: { phone: "+79000000000" },
  items: [
    {
      description: "Заказ",
      quantity: "1.00",
      amount: { value: "6930.00", currency: "RUB" as const },
      vat_code: 1,
      payment_subject: "commodity" as const,
      payment_mode: "full_prepayment" as const,
      measure: "piece" as const
    }
  ]
};

describe("YooKassa client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("logs safe diagnostics for invalid return URL before provider calls", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn();

    await expect(
      createYooKassaPayment(
        {
          publicNumber: "KRM-20260602-8E3EBA",
          amountKopecks: 693000,
          idempotencyKey: "key",
          receipt
        },
        { ...config, returnUrl: "not-a-url" },
        fetchMock
      )
    ).rejects.toThrow(YooKassaProviderError);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "yookassa_payment_issue",
      expect.objectContaining({
        operation: "create_payment_invalid_request",
        publicNumber: "KRM-20260602-8E3EBA",
        httpStatus: null,
        providerDescription: "invalid return_url",
        providerParameter: "confirmation.return_url"
      })
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(config.secretKey);
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
        idempotencyKey: "karma-KRM-20260602-8E3EBA-payment-v1",
        receipt
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
      receipt,
      save_payment_method: false
    });
    expect(JSON.stringify(result)).not.toContain(config.secretKey);
  });

  it.each([401, 403, 400])("throws and logs safe diagnostics for provider HTTP %s", async (status) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "error",
          code: status === 400 ? "invalid_request" : "unauthorized",
          description: "safe provider message",
          parameter: "amount.value"
        }),
        { status }
      )
    );

    await expect(
      createYooKassaPayment(
        {
          publicNumber: "KRM-20260602-8E3EBA",
          amountKopecks: 693000,
          idempotencyKey: "key",
          receipt
        },
        config,
        fetchMock
      )
    ).rejects.toThrow(YooKassaProviderError);

    expect(consoleError).toHaveBeenCalledWith(
      "yookassa_payment_issue",
      expect.objectContaining({
        operation: "create_payment",
        publicNumber: "KRM-20260602-8E3EBA",
        httpStatus: status,
        providerCode: status === 400 ? "invalid_request" : "unauthorized",
        providerDescription: "safe provider message",
        providerParameter: "amount.value"
      })
    );
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain(config.secretKey);
    expect(logged).not.toContain("Authorization");
    expect(logged).not.toContain("Basic ");
  });

  it("maps provider statuses without marking pending payments as paid", () => {
    expect(mapYooKassaStatus("pending")).toBe("PENDING");
    expect(mapYooKassaStatus("waiting_for_capture")).toBe("PENDING");
    expect(mapYooKassaStatus("succeeded")).toBe("PAID");
    expect(mapYooKassaStatus("canceled")).toBe("CANCELLED");
  });
});
