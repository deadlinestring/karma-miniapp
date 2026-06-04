import "server-only";

import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

type PrismaLike = typeof prisma;

type YooKassaWebhookPaymentObject = {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  metadata?: {
    orderPublicNumber?: unknown;
  };
};

export type YooKassaWebhookResult =
  | { ok: true; action: "updated"; event: "payment.succeeded" | "payment.canceled"; paymentStatus: PaymentStatus }
  | { ok: true; action: "ignored"; reason: string };

export type YooKassaWebhookServices = {
  db: Pick<PrismaLike, "payment" | "order" | "$transaction">;
  logger: Pick<typeof console, "warn" | "error">;
};

const defaultServices: YooKassaWebhookServices = {
  db: prisma,
  logger: console
};

export async function processYooKassaWebhook(
  payload: unknown,
  services: YooKassaWebhookServices = defaultServices
): Promise<YooKassaWebhookResult> {
  const parsed = parseWebhookPayload(payload);

  if (!parsed.ok) {
    logWebhookIssue(services.logger, {
      operation: "invalid_payload",
      event: null,
      providerPaymentId: null,
      reason: parsed.reason
    });
    return { ok: true, action: "ignored", reason: parsed.reason };
  }

  const { event, paymentObject } = parsed;

  if (event !== "payment.succeeded" && event !== "payment.canceled") {
    logWebhookIssue(services.logger, {
      operation: "ignored_event",
      event,
      providerPaymentId: paymentObject.id,
      reason: "unsupported_event"
    });
    return { ok: true, action: "ignored", reason: "unsupported_event" };
  }

  const amountKopecks = parseRublesToKopecks(paymentObject.amount.value, paymentObject.amount.currency);

  if (amountKopecks === null) {
    logWebhookIssue(services.logger, {
      operation: "invalid_amount",
      event,
      providerPaymentId: paymentObject.id,
      reason: "invalid_amount"
    });
    return { ok: true, action: "ignored", reason: "invalid_amount" };
  }

  const payment = await services.db.payment.findFirst({
    where: {
      provider: "YOOKASSA",
      providerPaymentId: paymentObject.id
    },
    select: {
      id: true,
      amountKopecks: true,
      status: true,
      order: {
        select: {
          id: true,
          publicNumber: true,
          paymentStatus: true
        }
      }
    }
  });

  if (!payment) {
    logWebhookIssue(services.logger, {
      operation: "payment_not_found",
      event,
      providerPaymentId: paymentObject.id,
      reason: "payment_not_found"
    });
    return { ok: true, action: "ignored", reason: "payment_not_found" };
  }

  if (payment.amountKopecks !== amountKopecks) {
    logWebhookIssue(services.logger, {
      operation: "amount_mismatch",
      event,
      providerPaymentId: paymentObject.id,
      reason: "amount_mismatch"
    });
    return { ok: true, action: "ignored", reason: "amount_mismatch" };
  }

  const metadataOrderPublicNumber = readMetadataOrderPublicNumber(paymentObject.metadata);

  if (metadataOrderPublicNumber && metadataOrderPublicNumber !== payment.order.publicNumber) {
    logWebhookIssue(services.logger, {
      operation: "metadata_order_mismatch",
      event,
      providerPaymentId: paymentObject.id,
      reason: "metadata_order_mismatch"
    });
    return { ok: true, action: "ignored", reason: "metadata_order_mismatch" };
  }

  if (event === "payment.succeeded") {
    await services.db.$transaction([
      services.db.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" }
      }),
      services.db.order.update({
        where: { id: payment.order.id },
        data: { paymentStatus: "PAID" }
      })
    ]);

    return { ok: true, action: "updated", event, paymentStatus: "PAID" };
  }

  if (payment.status === "PAID" || payment.order.paymentStatus === "PAID") {
    logWebhookIssue(services.logger, {
      operation: "cancel_ignored_paid_order",
      event,
      providerPaymentId: paymentObject.id,
      reason: "already_paid"
    });
    return { ok: true, action: "ignored", reason: "already_paid" };
  }

  await services.db.payment.update({
    where: { id: payment.id },
    data: { status: "CANCELLED" }
  });

  return { ok: true, action: "updated", event, paymentStatus: "CANCELLED" };
}

function parseWebhookPayload(payload: unknown):
  | { ok: true; event: string; paymentObject: YooKassaWebhookPaymentObject }
  | { ok: false; reason: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "payload_not_object" };
  }

  const event = readString((payload as { event?: unknown }).event);
  const object = (payload as { object?: unknown }).object;

  if (!event || !object || typeof object !== "object") {
    return { ok: false, reason: "missing_event_or_object" };
  }

  const providerPaymentId = readString((object as { id?: unknown }).id);
  const status = readString((object as { status?: unknown }).status);
  const amount = (object as { amount?: unknown }).amount;

  if (!providerPaymentId || !status || !amount || typeof amount !== "object") {
    return { ok: false, reason: "invalid_payment_object" };
  }

  const amountValue = readString((amount as { value?: unknown }).value);
  const amountCurrency = readString((amount as { currency?: unknown }).currency);

  if (!amountValue || !amountCurrency) {
    return { ok: false, reason: "invalid_amount" };
  }

  return {
    ok: true,
    event,
    paymentObject: {
      id: providerPaymentId,
      status,
      amount: {
        value: amountValue,
        currency: amountCurrency
      },
      metadata: (object as { metadata?: YooKassaWebhookPaymentObject["metadata"] }).metadata
    }
  };
}

function parseRublesToKopecks(value: string, currency: string) {
  if (currency !== "RUB" || !/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [rubles, kopecks = ""] = value.split(".");
  return Number(rubles) * 100 + Number(kopecks.padEnd(2, "0"));
}

function readMetadataOrderPublicNumber(metadata: YooKassaWebhookPaymentObject["metadata"]) {
  const value = metadata?.orderPublicNumber;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function maskProviderPaymentId(value: string | null) {
  if (!value) {
    return null;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function logWebhookIssue(
  logger: Pick<typeof console, "warn" | "error">,
  details: {
    operation: string;
    event: string | null;
    providerPaymentId: string | null;
    reason: string;
  }
) {
  logger.warn("yookassa_webhook_issue", {
    operation: details.operation,
    event: details.event,
    providerPaymentId: maskProviderPaymentId(details.providerPaymentId),
    reason: details.reason
  });
}
