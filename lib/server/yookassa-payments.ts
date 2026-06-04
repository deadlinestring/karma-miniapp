import "server-only";

import type { PaymentStatus } from "@prisma/client";
import type { TelegramAuthUser } from "@/lib/server/telegram-auth";
import { evaluatePaymentEligibility, type PaymentEligibilityResult } from "@/lib/server/payment-eligibility";
import { prisma } from "@/lib/server/prisma";
import { createYooKassaPayment } from "@/lib/server/yookassa-client";
import { getYooKassaConfig, isYooKassaPaymentsEnabled } from "@/lib/server/yookassa-config";

type PrismaLike = typeof prisma;

export type PreparedYooKassaPayment =
  | {
      ok: true;
      payment: {
        provider: "YOOKASSA";
        providerEnabled: true;
        eligible: true;
        reused: boolean;
        paymentId: string;
        providerPaymentId: string | null;
        status: PaymentStatus;
        confirmationUrl: string;
      };
    }
  | {
      ok: true;
      payment: {
        provider: "YOOKASSA";
        providerEnabled: false;
        eligible: boolean;
        reason: PaymentEligibilityResult["reason"] | "PROVIDER_DISABLED" | "PROVIDER_ENV_MISSING";
        message: string;
      };
    }
  | { ok: false; reason: "ORDER_NOT_FOUND" };

export type YooKassaPaymentServices = {
  db: Pick<PrismaLike, "order" | "payment">;
  getConfig: typeof getYooKassaConfig;
  isPaymentsEnabled: typeof isYooKassaPaymentsEnabled;
  createProviderPayment: typeof createYooKassaPayment;
};

const defaultServices: YooKassaPaymentServices = {
  db: prisma,
  getConfig: getYooKassaConfig,
  isPaymentsEnabled: isYooKassaPaymentsEnabled,
  createProviderPayment: createYooKassaPayment
};

export async function prepareCustomerYooKassaPayment(
  publicNumber: string,
  telegramUser: TelegramAuthUser
) {
  return prepareCustomerYooKassaPaymentWithServices(publicNumber, telegramUser, defaultServices);
}

export async function prepareCustomerYooKassaPaymentWithServices(
  publicNumber: string,
  telegramUser: TelegramAuthUser,
  services: YooKassaPaymentServices
): Promise<PreparedYooKassaPayment> {
  const orderPublicNumber = readPublicNumber(publicNumber);
  const order = await services.db.order.findFirst({
    where: {
      publicNumber: orderPublicNumber,
      user: {
        telegramId: BigInt(telegramUser.id)
      }
    },
    select: {
      id: true,
      publicNumber: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      totalKopecks: true,
      items: {
        select: {
          customImageReviewStatus: true
        }
      },
      payments: {
        where: {
          provider: "YOOKASSA",
          status: "PENDING",
          confirmationUrl: { not: null }
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          providerPaymentId: true,
          amountKopecks: true,
          status: true,
          confirmationUrl: true
        }
      }
    }
  });

  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }

  const eligibility = evaluatePaymentEligibility(order);

  if (!eligibility.eligible) {
    return disabledPayment(eligibility.eligible, eligibility.reason, eligibility.message);
  }

  if (!services.isPaymentsEnabled()) {
    return disabledPayment(
      true,
      "PROVIDER_DISABLED",
      "Онлайн-оплата скоро появится. Сейчас менеджер подтвердит заказ и подскажет способ оплаты."
    );
  }

  const existingPayment = order.payments.find(
    (payment) => payment.amountKopecks === order.totalKopecks && payment.confirmationUrl
  );

  if (existingPayment?.confirmationUrl) {
    return {
      ok: true,
      payment: {
        provider: "YOOKASSA",
        providerEnabled: true,
        eligible: true,
        reused: true,
        paymentId: existingPayment.id,
        providerPaymentId: existingPayment.providerPaymentId,
        status: existingPayment.status,
        confirmationUrl: existingPayment.confirmationUrl
      }
    };
  }

  let config;

  try {
    config = services.getConfig();
  } catch {
    return disabledPayment(
      true,
      "PROVIDER_ENV_MISSING",
      "Онлайн-оплата скоро появится. Сейчас менеджер подтвердит заказ и подскажет способ оплаты."
    );
  }

  const idempotencyKey = buildPaymentIdempotencyKey(order.publicNumber);
  const providerPayment = await services.createProviderPayment(
    {
      publicNumber: order.publicNumber,
      amountKopecks: order.totalKopecks,
      idempotencyKey
    },
    config
  );
  const payment = await services.db.payment.create({
    data: {
      orderId: order.id,
      provider: "YOOKASSA",
      providerPaymentId: providerPayment.providerPaymentId,
      amountKopecks: order.totalKopecks,
      status: providerPayment.status,
      idempotencyKey,
      confirmationUrl: providerPayment.confirmationUrl
    },
    select: {
      id: true,
      providerPaymentId: true,
      status: true,
      confirmationUrl: true
    }
  });

  return {
    ok: true,
    payment: {
      provider: "YOOKASSA",
      providerEnabled: true,
      eligible: true,
      reused: false,
      paymentId: payment.id,
      providerPaymentId: payment.providerPaymentId,
      status: payment.status,
      confirmationUrl: payment.confirmationUrl ?? providerPayment.confirmationUrl
    }
  };
}

export function buildPaymentIdempotencyKey(publicNumber: string) {
  return `karma-${publicNumber}-payment-v1`;
}

function disabledPayment(
  eligible: boolean,
  reason: PaymentEligibilityResult["reason"] | "PROVIDER_DISABLED" | "PROVIDER_ENV_MISSING",
  message: string
): PreparedYooKassaPayment {
  return {
    ok: true,
    payment: {
      provider: "YOOKASSA",
      providerEnabled: false,
      eligible,
      reason,
      message
    }
  };
}

function readPublicNumber(value: unknown) {
  if (typeof value !== "string" || !/^KRM-\d{8}-[A-Z0-9]{6}$/.test(value.trim())) {
    throw new Error("invalid_order_number");
  }

  return value.trim();
}
