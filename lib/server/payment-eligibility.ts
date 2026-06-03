import "server-only";

import type { CustomImageReviewStatus, FulfillmentStatus, PaymentStatus } from "@prisma/client";
import type { TelegramAuthUser } from "@/lib/server/telegram-auth";
import { prisma } from "@/lib/server/prisma";

type PrismaLike = typeof prisma;

export type PaymentEligibilityResult = {
  eligible: boolean;
  reason:
    | "ELIGIBLE"
    | "ORDER_NOT_FOUND"
    | "PAYMENT_NOT_PENDING"
    | "INVALID_AMOUNT"
    | "ORDER_FINAL"
    | "CUSTOM_IMAGE_PENDING_REVIEW"
    | "CUSTOM_IMAGE_REJECTED";
  message: string;
};

export type PaymentEligibilityServices = {
  db: Pick<PrismaLike, "order">;
};

const defaultServices: PaymentEligibilityServices = { db: prisma };
const finalFulfillmentStatuses = new Set<FulfillmentStatus>(["COMPLETED", "CANCELLED"]);

export async function getCustomerOrderPaymentEligibility(
  publicNumber: string,
  telegramUser: TelegramAuthUser
) {
  return getCustomerOrderPaymentEligibilityWithServices(publicNumber, telegramUser, defaultServices);
}

export async function getCustomerOrderPaymentEligibilityWithServices(
  publicNumber: string,
  telegramUser: TelegramAuthUser,
  services: PaymentEligibilityServices
): Promise<PaymentEligibilityResult> {
  const order = await services.db.order.findFirst({
    where: {
      publicNumber: readPublicNumber(publicNumber),
      user: {
        telegramId: BigInt(telegramUser.id)
      }
    },
    select: {
      paymentStatus: true,
      fulfillmentStatus: true,
      totalKopecks: true,
      items: {
        select: {
          customImageReviewStatus: true
        }
      }
    }
  });

  if (!order) {
    return paymentEligibility("ORDER_NOT_FOUND", "Заказ не найден.");
  }

  return evaluatePaymentEligibility(order);
}

export function evaluatePaymentEligibility(order: {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  totalKopecks: number;
  items: Array<{ customImageReviewStatus: CustomImageReviewStatus }>;
}): PaymentEligibilityResult {
  if (order.paymentStatus !== "PENDING") {
    return paymentEligibility("PAYMENT_NOT_PENDING", "Этот заказ уже не ожидает оплату.");
  }

  if (finalFulfillmentStatuses.has(order.fulfillmentStatus)) {
    return paymentEligibility("ORDER_FINAL", "Для завершённого или отменённого заказа оплата недоступна.");
  }

  if (!Number.isInteger(order.totalKopecks) || order.totalKopecks <= 0) {
    return paymentEligibility("INVALID_AMOUNT", "Сумма заказа некорректна для онлайн-оплаты.");
  }

  const customStatuses = order.items
    .map((item) => item.customImageReviewStatus)
    .filter((status) => status !== "NOT_REQUIRED");

  if (customStatuses.includes("PENDING_REVIEW")) {
    return paymentEligibility(
      "CUSTOM_IMAGE_PENDING_REVIEW",
      "Изображение проверяется администратором. Оплата будет доступна после проверки."
    );
  }

  if (customStatuses.includes("REJECTED")) {
    return paymentEligibility(
      "CUSTOM_IMAGE_REJECTED",
      "Изображение отклонено. Свяжитесь с менеджером, чтобы согласовать заказ."
    );
  }

  return {
    eligible: true,
    reason: "ELIGIBLE",
    message: "Заказ готов к онлайн-оплате."
  };
}

function paymentEligibility(
  reason: Exclude<PaymentEligibilityResult["reason"], "ELIGIBLE">,
  message: string
): PaymentEligibilityResult {
  return {
    eligible: false,
    reason,
    message
  };
}

function readPublicNumber(value: unknown) {
  if (typeof value !== "string" || !/^KRM-\d{8}-[A-Z0-9]{6}$/.test(value.trim())) {
    throw new Error("invalid_order_number");
  }

  return value.trim();
}
