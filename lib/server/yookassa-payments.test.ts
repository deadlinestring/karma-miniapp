import { describe, expect, it, vi } from "vitest";
import {
  buildPaymentIdempotencyKey,
  prepareCustomerYooKassaPaymentWithServices
} from "./yookassa-payments";

const baseOrder = {
  id: "order-1",
  publicNumber: "KRM-20260602-8E3EBA",
  paymentStatus: "PENDING" as const,
  fulfillmentStatus: "NEW" as const,
  totalKopecks: 693000,
  customerPhone: "+79000000000",
  customerContact: null,
  deliveryKopecks: 45000,
  items: [
    {
      productNameSnapshot: "Свой дизайн",
      itemTypeSnapshot: "PREMIUM",
      itemTypeLabelSnapshot: "Премиум",
      sizeCmSnapshot: 30,
      unitPriceKopecks: 549000,
      baseSubtotalKopecks: 549000,
      discountKopecks: 0,
      quantity: 1,
      customDrawingSurchargeKopecks: 99000,
      customImageReviewStatus: "APPROVED" as const
    }
  ],
  payments: []
};

const config = {
  shopId: "shop",
  secretKey: "secret",
  returnUrl: "https://karma.example/return",
  webhookSecret: null,
  vatCode: 1
};

function servicesFor(order: unknown) {
  return {
    db: {
      order: {
        findFirst: vi.fn().mockResolvedValue(order)
      },
      payment: {
        create: vi.fn().mockResolvedValue({
          id: "payment-1",
          providerPaymentId: "yk-1",
          status: "PENDING",
          confirmationUrl: "https://yookassa.test/confirm"
        })
      }
    },
    isPaymentsEnabled: vi.fn().mockReturnValue(true),
    getConfig: vi.fn().mockReturnValue(config),
    createProviderPayment: vi.fn().mockResolvedValue({
      providerPaymentId: "yk-1",
      providerStatus: "pending",
      status: "PENDING",
      confirmationUrl: "https://yookassa.test/confirm"
    })
  };
}

describe("YooKassa payment preparation", () => {
  it("uses a stable idempotency key per order public number", () => {
    expect(buildPaymentIdempotencyKey("KRM-20260602-8E3EBA")).toBe(
      "karma-KRM-20260602-8E3EBA-payment-v1"
    );
  });

  it("creates a Payment row only after a successful provider payment for approved custom orders", async () => {
    const services = servicesFor(baseOrder);

    const result = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      services as any
    );

    expect(services.db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publicNumber: "KRM-20260602-8E3EBA",
          user: { telegramId: BigInt("12345") }
        }
      })
    );
    expect(services.createProviderPayment).toHaveBeenCalledWith(
      {
        publicNumber: "KRM-20260602-8E3EBA",
        amountKopecks: 693000,
        idempotencyKey: "karma-KRM-20260602-8E3EBA-payment-v1",
        receipt: expect.objectContaining({
          customer: { phone: "+79000000000" },
          items: expect.any(Array)
        })
      },
      config
    );
    expect(services.db.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        provider: "YOOKASSA",
        providerPaymentId: "yk-1",
        amountKopecks: 693000,
        status: "PENDING",
        idempotencyKey: "karma-KRM-20260602-8E3EBA-payment-v1",
        confirmationUrl: "https://yookassa.test/confirm"
      },
      select: {
        id: true,
        providerPaymentId: true,
        status: true,
        confirmationUrl: true
      }
    });
    expect(result).toMatchObject({
      ok: true,
      payment: {
        providerEnabled: true,
        eligible: true,
        reused: false,
        confirmationUrl: "https://yookassa.test/confirm"
      }
    });
    expect("update" in services.db.order).toBe(false);
  });

  it("creates regular pending order payments", async () => {
    const services = servicesFor({
      ...baseOrder,
      totalKopecks: 604000,
      deliveryKopecks: 55000,
      items: [
        {
          productNameSnapshot: "Ночник",
          itemTypeSnapshot: "PREMIUM",
          itemTypeLabelSnapshot: "Премиум",
          sizeCmSnapshot: 30,
          unitPriceKopecks: 549000,
          baseSubtotalKopecks: 549000,
          discountKopecks: 0,
          quantity: 1,
          customDrawingSurchargeKopecks: 0,
          customImageReviewStatus: "NOT_REQUIRED" as const
        }
      ]
    });

    const result = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      services as any
    );

    expect(result).toMatchObject({ ok: true, payment: { providerEnabled: true } });
    expect(services.createProviderPayment).toHaveBeenCalledTimes(1);
    expect(services.db.payment.create).toHaveBeenCalledTimes(1);
  });

  it("reuses an existing pending Payment with confirmationUrl", async () => {
    const services = servicesFor({
      ...baseOrder,
      payments: [
        {
          id: "payment-existing",
          providerPaymentId: "yk-existing",
          amountKopecks: 693000,
          status: "PENDING",
          confirmationUrl: "https://yookassa.test/existing"
        }
      ]
    });

    const result = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      services as any
    );

    expect(result).toMatchObject({
      ok: true,
      payment: {
        reused: true,
        paymentId: "payment-existing",
        confirmationUrl: "https://yookassa.test/existing"
      }
    });
    expect(services.createProviderPayment).not.toHaveBeenCalled();
    expect(services.db.payment.create).not.toHaveBeenCalled();
  });

  it("blocks pending custom review without provider calls", async () => {
    const services = servicesFor({
      ...baseOrder,
      items: [{ customImageReviewStatus: "PENDING_REVIEW" as const }]
    });

    const result = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      services as any
    );

    expect(result).toMatchObject({
      ok: true,
      payment: {
        providerEnabled: false,
        eligible: false,
        reason: "CUSTOM_IMAGE_PENDING_REVIEW"
      }
    });
    expect(services.createProviderPayment).not.toHaveBeenCalled();
    expect(services.db.payment.create).not.toHaveBeenCalled();
  });

  it("returns safe not found for foreign orders", async () => {
    const services = servicesFor(null);

    await expect(
      prepareCustomerYooKassaPaymentWithServices("KRM-20260602-8E3EBA", { id: "12345" }, services as any)
    ).resolves.toEqual({ ok: false, reason: "ORDER_NOT_FOUND" });
  });

  it("does not create Payment when provider env is missing or provider fails", async () => {
    const disabledFlag = servicesFor(baseOrder);
    disabledFlag.isPaymentsEnabled.mockReturnValue(false);

    const disabledByFlag = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      disabledFlag as any
    );

    expect(disabledByFlag).toMatchObject({
      ok: true,
      payment: { providerEnabled: false, eligible: true, reason: "PROVIDER_DISABLED" }
    });
    expect(disabledFlag.getConfig).not.toHaveBeenCalled();
    expect(disabledFlag.createProviderPayment).not.toHaveBeenCalled();
    expect(disabledFlag.db.payment.create).not.toHaveBeenCalled();

    const disabledWithExistingPayment = servicesFor({
      ...baseOrder,
      payments: [
        {
          id: "payment-existing",
          providerPaymentId: "yk-existing",
          amountKopecks: 693000,
          status: "PENDING",
          confirmationUrl: "https://yookassa.test/existing"
        }
      ]
    });
    disabledWithExistingPayment.isPaymentsEnabled.mockReturnValue(false);

    const existingDisabled = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      disabledWithExistingPayment as any
    );

    expect(existingDisabled).toMatchObject({
      ok: true,
      payment: { providerEnabled: false, eligible: true, reason: "PROVIDER_DISABLED" }
    });
    expect(JSON.stringify(existingDisabled)).not.toContain("confirmationUrl");

    const envMissing = servicesFor(baseOrder);
    envMissing.getConfig.mockImplementation(() => {
      throw new Error("yookassa_secret_key_missing");
    });

    const disabled = await prepareCustomerYooKassaPaymentWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      envMissing as any
    );

    expect(disabled).toMatchObject({
      ok: true,
      payment: { providerEnabled: false, eligible: true, reason: "PROVIDER_ENV_MISSING" }
    });
    expect(envMissing.createProviderPayment).not.toHaveBeenCalled();
    expect(envMissing.db.payment.create).not.toHaveBeenCalled();

    const providerFails = servicesFor(baseOrder);
    providerFails.createProviderPayment.mockRejectedValue(new Error("yookassa_payment_create_failed"));

    await expect(
      prepareCustomerYooKassaPaymentWithServices("KRM-20260602-8E3EBA", { id: "12345" }, providerFails as any)
    ).rejects.toThrow("yookassa_payment_create_failed");
    expect(providerFails.db.payment.create).not.toHaveBeenCalled();
    expect("update" in providerFails.db.order).toBe(false);
  });

  it("blocks provider calls safely when receipt customer contact is missing", async () => {
    const services = servicesFor({
      ...baseOrder,
      customerPhone: "",
      customerContact: ""
    });

    await expect(
      prepareCustomerYooKassaPaymentWithServices("KRM-20260602-8E3EBA", { id: "12345" }, services as any)
    ).rejects.toThrow("yookassa_receipt_customer_missing");

    expect(services.createProviderPayment).not.toHaveBeenCalled();
    expect(services.db.payment.create).not.toHaveBeenCalled();
  });
});
