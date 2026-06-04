import { describe, expect, it, vi } from "vitest";
import { processYooKassaWebhook } from "./yookassa-webhook";

const succeededPayload = {
  event: "payment.succeeded",
  object: {
    id: "31b366f0-aaaa-bbbb-cccc-123456786d17",
    status: "succeeded",
    amount: { value: "2940.00", currency: "RUB" },
    metadata: { orderPublicNumber: "KRM-20260604-59DE22" }
  }
};

const basePayment = {
  id: "payment-1",
  amountKopecks: 294000,
  status: "PENDING" as const,
  order: {
    id: "order-1",
    publicNumber: "KRM-20260604-59DE22",
    paymentStatus: "PENDING" as const
  }
};

function servicesFor(payment: unknown = basePayment) {
  const paymentUpdate = vi.fn().mockResolvedValue({});
  const orderUpdate = vi.fn().mockResolvedValue({});

  return {
    db: {
      payment: {
        findFirst: vi.fn().mockResolvedValue(payment),
        update: paymentUpdate
      },
      order: {
        update: orderUpdate
      },
      $transaction: vi.fn().mockResolvedValue([{}, {}])
    },
    logger: {
      warn: vi.fn(),
      error: vi.fn()
    }
  };
}

describe("YooKassa webhook processor", () => {
  it("updates Payment and Order.paymentStatus for payment.succeeded", async () => {
    const services = servicesFor();

    const result = await processYooKassaWebhook(succeededPayload, services as any);

    expect(result).toEqual({
      ok: true,
      action: "updated",
      event: "payment.succeeded",
      paymentStatus: "PAID"
    });
    expect(services.db.payment.findFirst).toHaveBeenCalledWith({
      where: {
        provider: "YOOKASSA",
        providerPaymentId: "31b366f0-aaaa-bbbb-cccc-123456786d17"
      },
      select: expect.any(Object)
    });
    expect(services.db.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-1" },
      data: { status: "PAID" }
    });
    expect(services.db.order.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { paymentStatus: "PAID" }
    });
    expect(services.db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("is idempotent for duplicate payment.succeeded events", async () => {
    const services = servicesFor({
      ...basePayment,
      status: "PAID" as const,
      order: { ...basePayment.order, paymentStatus: "PAID" as const }
    });

    const result = await processYooKassaWebhook(succeededPayload, services as any);

    expect(result).toMatchObject({ ok: true, action: "updated", paymentStatus: "PAID" });
    expect(services.db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("updates canceled Payment but does not mark Order paid", async () => {
    const services = servicesFor();

    const result = await processYooKassaWebhook(
      {
        ...succeededPayload,
        event: "payment.canceled",
        object: { ...succeededPayload.object, status: "canceled" }
      },
      services as any
    );

    expect(result).toEqual({
      ok: true,
      action: "updated",
      event: "payment.canceled",
      paymentStatus: "CANCELLED"
    });
    expect(services.db.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-1" },
      data: { status: "CANCELLED" }
    });
    expect(services.db.order.update).not.toHaveBeenCalled();
    expect(services.db.$transaction).not.toHaveBeenCalled();
  });

  it("ignores unknown events safely", async () => {
    const services = servicesFor();
    const result = await processYooKassaWebhook({ ...succeededPayload, event: "refund.succeeded" }, services as any);

    expect(result).toEqual({ ok: true, action: "ignored", reason: "unsupported_event" });
    expect(services.db.payment.findFirst).not.toHaveBeenCalled();
    expect(services.logger.warn).toHaveBeenCalledWith(
      "yookassa_webhook_issue",
      expect.objectContaining({
        operation: "ignored_event",
        providerPaymentId: "31b366...6d17"
      })
    );
  });

  it("does not create or update anything when provider payment is not found", async () => {
    const services = servicesFor(null);

    const result = await processYooKassaWebhook(succeededPayload, services as any);

    expect(result).toEqual({ ok: true, action: "ignored", reason: "payment_not_found" });
    expect("create" in services.db.payment).toBe(false);
    expect(services.db.payment.update).not.toHaveBeenCalled();
    expect(services.db.order.update).not.toHaveBeenCalled();
  });

  it("rejects amount mismatch without updates", async () => {
    const services = servicesFor({ ...basePayment, amountKopecks: 1 });

    const result = await processYooKassaWebhook(succeededPayload, services as any);

    expect(result).toEqual({ ok: true, action: "ignored", reason: "amount_mismatch" });
    expect(services.db.payment.update).not.toHaveBeenCalled();
    expect(services.db.order.update).not.toHaveBeenCalled();
  });

  it("rejects metadata order mismatch without updates", async () => {
    const services = servicesFor();

    const result = await processYooKassaWebhook(
      {
        ...succeededPayload,
        object: {
          ...succeededPayload.object,
          metadata: { orderPublicNumber: "KRM-20260604-AAAAAA" }
        }
      },
      services as any
    );

    expect(result).toEqual({ ok: true, action: "ignored", reason: "metadata_order_mismatch" });
    expect(services.db.payment.update).not.toHaveBeenCalled();
    expect(services.db.order.update).not.toHaveBeenCalled();
  });

  it("does not log secrets or full payload", async () => {
    const services = servicesFor(null);

    await processYooKassaWebhook(
      {
        ...succeededPayload,
        object: {
          ...succeededPayload.object,
          metadata: {
            orderPublicNumber: "KRM-20260604-59DE22",
            secret: "must-not-be-logged",
            phone: "+79000000000"
          }
        }
      },
      services as any
    );

    const logged = JSON.stringify(services.logger.warn.mock.calls);
    expect(logged).not.toContain("must-not-be-logged");
    expect(logged).not.toContain("+79000000000");
    expect(logged).not.toContain("31b366f0-aaaa-bbbb-cccc-123456786d17");
    expect(logged).toContain("31b366...6d17");
  });
});
