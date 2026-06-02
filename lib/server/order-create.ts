import "server-only";

import { randomBytes } from "crypto";
import type { CustomImageReviewStatus, FulfillmentStatus, PaymentStatus } from "@prisma/client";
import type { TelegramAuthUser } from "@/lib/server/telegram-auth";
import {
  quoteOrderWithServices,
  type OrderQuoteResult,
  type OrderQuoteServices
} from "@/lib/server/order-quote";
import { sendOrderCreatedAdminNotifications } from "@/lib/server/order-notifications";
import { prisma } from "@/lib/server/prisma";
import { isManagedCustomOrderImagePath } from "@/lib/server/supabase-storage";

type PrismaLike = typeof prisma;

export type OrderCreateServices = {
  db: Pick<PrismaLike, "$transaction">;
  generatePublicNumber?: () => string;
  notifyOrderCreated?: (publicNumber: string) => Promise<unknown>;
};

export type OrderCreateInput = {
  items: unknown;
  deliveryMethod: unknown;
  deliveryAddress?: unknown;
  customerFallbackContact?: unknown;
  comment?: unknown;
  consentPersonalData?: unknown;
};

export type OrderCreateResult = {
  publicNumber: string;
  status: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  summary: OrderQuoteResult["summary"];
  message: string;
};

type ParsedDeliveryAddress = {
  recipientName: string;
  phone: string;
  city: string;
  postalCode: string | null;
  street: string;
  house: string;
  apartment: string | null;
  comment: string | null;
};

type ParsedCreateInput = {
  quotePayload: {
    items: OrderCreateInput["items"];
    deliveryMethod: "RUSSIAN_POST";
  };
  deliveryAddress: ParsedDeliveryAddress;
  customerFallbackContact: string | null;
  comment: string | null;
  consentPersonalData: true;
};

const defaultServices: OrderCreateServices = {
  db: prisma,
  notifyOrderCreated: sendOrderCreatedAdminNotifications
};
const TELEGRAM_ORDER_REQUIRED_MESSAGE =
  "Откройте магазин внутри Telegram, чтобы оформить заказ.";
const ORDER_CREATED_MESSAGE =
  "Заказ создан. Мы свяжемся с вами для подтверждения.";
const CUSTOM_REVIEW_MESSAGE =
  "Заказ создан и ожидает проверки изображения администратором.";

export class OrderCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderCreateError";
  }
}

export async function createOrder(input: unknown, telegramUser: TelegramAuthUser) {
  return createOrderWithServices(input, telegramUser, defaultServices);
}

export async function createOrderWithServices(
  input: unknown,
  telegramUser: TelegramAuthUser,
  services: OrderCreateServices
): Promise<OrderCreateResult> {
  const payload = parseCreateInput(input);
  const generatePublicNumber = services.generatePublicNumber ?? createPublicNumber;

  const result = await services.db.$transaction(async (tx) => {
    const quote = await quoteOrderWithServices(payload.quotePayload, {
      db: tx as OrderQuoteServices["db"]
    });
    validateCustomImageOwnership(quote, telegramUser);
    const user = await tx.telegramUser.upsert({
      where: { telegramId: BigInt(telegramUser.id) },
      create: {
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username ?? null,
        firstName: telegramUser.firstName ?? null,
        lastName: telegramUser.lastName ?? null,
        phone: payload.deliveryAddress.phone
      },
      update: {
        username: telegramUser.username ?? null,
        firstName: telegramUser.firstName ?? null,
        lastName: telegramUser.lastName ?? null,
        phone: payload.deliveryAddress.phone
      },
      select: { id: true }
    });
    const publicNumber = await reservePublicNumber(tx, generatePublicNumber);
    const hasCustomDrawing = quote.items.some((item) => item.customDrawingStyle);
    const fulfillmentStatus: FulfillmentStatus = "NEW";
    const paymentStatus: PaymentStatus = "PENDING";

    const order = await tx.order.create({
      data: {
        publicNumber,
        userId: user.id,
        customerName: payload.deliveryAddress.recipientName,
        customerPhone: payload.deliveryAddress.phone,
        customerTelegramUsername: telegramUser.username ?? null,
        customerTelegramId: BigInt(telegramUser.id),
        customerTelegramFirstName: telegramUser.firstName ?? null,
        customerTelegramLastName: telegramUser.lastName ?? null,
        customerContact: payload.customerFallbackContact,
        comment: payload.comment,
        itemsSubtotalKopecks: quote.summary.itemsSubtotalKopecks,
        customDrawingKopecks: quote.summary.customDrawingTotalKopecks,
        deliveryMethod: quote.summary.deliveryMethod,
        deliveryKopecks: quote.summary.deliveryAmountKopecks,
        discountKopecks: quote.summary.discountAmountKopecks,
        totalKopecks: quote.summary.totalKopecks,
        paymentProvider: "DEMO",
        paymentStatus,
        fulfillmentStatus,
        consentPersonalData: payload.consentPersonalData,
        deliveryAddress: {
          create: {
            city: payload.deliveryAddress.city,
            postalCode: payload.deliveryAddress.postalCode,
            addressLine: buildAddressLine(payload.deliveryAddress),
            street: payload.deliveryAddress.street,
            house: payload.deliveryAddress.house,
            apartment: payload.deliveryAddress.apartment,
            comment: payload.deliveryAddress.comment
          }
        },
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            priceListItemId: item.priceListItemId,
            productNameSnapshot: item.productName,
            productSlugSnapshot: item.productSlug,
            itemTypeSnapshot: item.itemType,
            itemTypeLabelSnapshot: item.itemTypeLabel,
            sizeCmSnapshot: item.sizeCm,
            noteSnapshot: item.note,
            unitPriceKopecks: item.unitPriceKopecks,
            baseSubtotalKopecks: item.lineSubtotalKopecks,
            customDrawingStyle: item.customDrawingStyle,
            customDrawingSurchargeKopecks: item.customDrawingSurchargeKopecks,
            customDesignKey: item.customDesignKey,
            customImageStoragePath: item.customImageStoragePath,
            customImageReviewStatus: getCustomImageReviewStatus(item.customDrawingStyle),
            discountKopecks: item.discountKopecks,
            quantity: item.quantity,
            subtotalKopecks: item.lineTotalKopecks
          }))
        }
      },
      select: {
        publicNumber: true,
        fulfillmentStatus: true,
        paymentStatus: true
      }
    });

    return {
      publicNumber: order.publicNumber,
      status: order.fulfillmentStatus,
      paymentStatus: order.paymentStatus,
      summary: quote.summary,
      message: hasCustomDrawing ? CUSTOM_REVIEW_MESSAGE : ORDER_CREATED_MESSAGE
    };
  });

  await services.notifyOrderCreated?.(result.publicNumber).catch(() => undefined);

  return result;
}

function parseCreateInput(input: unknown): ParsedCreateInput {
  if (!input || typeof input !== "object") {
    throw new OrderCreateError("Передайте данные заказа.");
  }

  const payload = input as OrderCreateInput;

  if (payload.deliveryMethod !== "RUSSIAN_POST") {
    throw new OrderCreateError("Сейчас доступна только доставка Почтой России.");
  }

  if (payload.consentPersonalData !== true) {
    throw new OrderCreateError("Подтвердите согласие на обработку данных.");
  }

  return {
    quotePayload: {
      items: payload.items,
      deliveryMethod: "RUSSIAN_POST"
    },
    deliveryAddress: parseDeliveryAddress(payload.deliveryAddress),
    customerFallbackContact: optionalText(payload.customerFallbackContact, 160),
    comment: optionalText(payload.comment, 500),
    consentPersonalData: true
  };
}

function parseDeliveryAddress(input: unknown): ParsedDeliveryAddress {
  if (!input || typeof input !== "object") {
    throw new OrderCreateError("Заполните адрес доставки.");
  }

  const address = input as Record<string, unknown>;

  return {
    recipientName: requiredText(address.recipientName, "Укажите имя получателя.", 2, 120),
    phone: parsePhone(address.phone),
    city: requiredText(address.city, "Укажите город доставки.", 2, 80),
    postalCode: optionalPostalCode(address.postalCode),
    street: requiredText(address.street, "Укажите улицу.", 2, 120),
    house: requiredText(address.house, "Укажите дом.", 1, 40),
    apartment: optionalText(address.apartment, 40),
    comment: optionalText(address.comment, 500)
  };
}

function requiredText(input: unknown, message: string, minLength: number, maxLength: number) {
  if (typeof input !== "string") {
    throw new OrderCreateError(message);
  }

  const value = input.trim();

  if (value.length < minLength || value.length > maxLength) {
    throw new OrderCreateError(message);
  }

  return value;
}

function optionalText(input: unknown, maxLength: number) {
  if (input === undefined || input === null) {
    return null;
  }

  if (typeof input !== "string") {
    throw new OrderCreateError("Проверьте дополнительные поля заказа.");
  }

  const value = input.trim();

  if (!value) {
    return null;
  }

  if (value.length > maxLength) {
    throw new OrderCreateError("Слишком длинное значение в форме заказа.");
  }

  return value;
}

function parsePhone(input: unknown) {
  const value = requiredText(input, "Укажите телефон для связи.", 5, 32);

  if (!/^[+\d][\d\s\-()]{4,31}$/.test(value)) {
    throw new OrderCreateError("Проверьте телефон для связи.");
  }

  return value;
}

function optionalPostalCode(input: unknown) {
  const value = optionalText(input, 12);

  if (!value) {
    return null;
  }

  if (!/^\d{4,12}$/.test(value)) {
    throw new OrderCreateError("Проверьте почтовый индекс.");
  }

  return value;
}

function buildAddressLine(address: ParsedDeliveryAddress) {
  return [
    address.postalCode,
    address.city,
    `ул. ${address.street}`,
    `д. ${address.house}`,
    address.apartment ? `кв. ${address.apartment}` : null
  ]
    .filter(Boolean)
    .join(", ");
}

function validateCustomImageOwnership(quote: OrderQuoteResult, telegramUser: TelegramAuthUser) {
  for (const item of quote.items) {
    if (!item.customDrawingStyle) {
      continue;
    }

    if (!isManagedCustomOrderImagePath(telegramUser.id, item.customImageStoragePath)) {
      throw new OrderCreateError("Изображение своего дизайна нужно загрузить заново.");
    }
  }
}

function getCustomImageReviewStatus(
  customDrawingStyle: string | null
): CustomImageReviewStatus {
  return customDrawingStyle ? "PENDING_REVIEW" : "NOT_REQUIRED";
}

async function reservePublicNumber(tx: any, generatePublicNumber: () => string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicNumber = generatePublicNumber();
    const existingOrder = await tx.order.findUnique({
      where: { publicNumber },
      select: { id: true }
    });

    if (!existingOrder) {
      return publicNumber;
    }
  }

  throw new OrderCreateError("Не удалось подготовить номер заказа. Попробуйте ещё раз.");
}

function createPublicNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();

  return `KRM-${date}-${suffix}`;
}

export { TELEGRAM_ORDER_REQUIRED_MESSAGE };
