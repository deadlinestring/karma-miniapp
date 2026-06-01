import "server-only";

import { randomUUID } from "crypto";
import type { ItemType } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

type NotificationDb = Pick<typeof prisma, "order" | "notificationLog">;

type OrderForNotification = Awaited<ReturnType<typeof loadOrderForNotification>>;

export type OrderNotificationServices = {
  db: NotificationDb;
  fetch: typeof fetch;
  botToken?: string;
  adminIds?: string;
  now?: () => Date;
};

export type OrderNotificationResult = {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
};

const ORDER_CREATED_ADMIN_TYPE = "ORDER_CREATED_ADMIN";
const ORDER_CREATED_ADMIN_FAILED_TYPE = "ORDER_CREATED_ADMIN_FAILED";

const defaultServices: OrderNotificationServices = {
  db: prisma,
  fetch: globalThis.fetch.bind(globalThis),
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  adminIds: process.env.ADMIN_TELEGRAM_IDS
};

export async function sendOrderCreatedAdminNotifications(
  publicNumber: string,
  services: OrderNotificationServices = defaultServices
): Promise<OrderNotificationResult> {
  const botToken = services.botToken;
  const adminIds = parseAdminTelegramIds(services.adminIds);

  if (!botToken || adminIds.length === 0) {
    return { attempted: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const order = await loadOrderForNotification(services.db, publicNumber);

  if (!order) {
    return { attempted: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const text = formatOrderCreatedMessage(order);
  const result: OrderNotificationResult = {
    attempted: adminIds.length,
    sent: 0,
    skipped: 0,
    failed: 0
  };

  for (const adminId of adminIds) {
    const deduplicationKey = buildSuccessDeduplicationKey(order.publicNumber, adminId);
    const existingSentLog = await services.db.notificationLog.findFirst({
      where: { deduplicationKey, sentAt: { not: null } },
      select: { id: true }
    });

    if (existingSentLog) {
      result.skipped += 1;
      continue;
    }

    try {
      const response = await services.fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminId,
            text,
            disable_web_page_preview: true
          })
        }
      );

      if (!response.ok) {
        throw new Error("telegram_send_failed");
      }

      await services.db.notificationLog.create({
        data: {
          orderId: order.id,
          type: ORDER_CREATED_ADMIN_TYPE,
          recipientTelegramId: BigInt(adminId),
          deduplicationKey,
          sentAt: (services.now ?? (() => new Date()))()
        }
      });
      result.sent += 1;
    } catch {
      await writeFailedNotificationLog(services, order.id, adminId, deduplicationKey);
      result.failed += 1;
    }
  }

  return result;
}

async function loadOrderForNotification(db: NotificationDb, publicNumber: string) {
  return db.order.findUnique({
    where: { publicNumber },
    select: {
      id: true,
      publicNumber: true,
      customerName: true,
      customerPhone: true,
      customerTelegramUsername: true,
      customerContact: true,
      comment: true,
      itemsSubtotalKopecks: true,
      customDrawingKopecks: true,
      deliveryMethod: true,
      deliveryKopecks: true,
      discountKopecks: true,
      totalKopecks: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      deliveryAddress: {
        select: {
          city: true,
          addressLine: true,
          street: true,
          house: true,
          apartment: true,
          postalCode: true,
          comment: true
        }
      },
      user: {
        select: {
          username: true
        }
      },
      items: {
        select: {
          productNameSnapshot: true,
          itemTypeSnapshot: true,
          itemTypeLabelSnapshot: true,
          sizeCmSnapshot: true,
          unitPriceKopecks: true,
          quantity: true,
          discountKopecks: true,
          subtotalKopecks: true,
          noteSnapshot: true,
          customDrawingSurchargeKopecks: true
        },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

function parseAdminTelegramIds(value?: string) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => /^\d+$/.test(id))
    )
  );
}

function buildSuccessDeduplicationKey(publicNumber: string, adminId: string) {
  return `order:new:${publicNumber}:admin:${adminId}`;
}

async function writeFailedNotificationLog(
  services: OrderNotificationServices,
  orderId: string,
  adminId: string,
  successDeduplicationKey: string
) {
  try {
    await services.db.notificationLog.create({
      data: {
        orderId,
        type: ORDER_CREATED_ADMIN_FAILED_TYPE,
        recipientTelegramId: BigInt(adminId),
        deduplicationKey: `${successDeduplicationKey}:failed:${randomUUID()}`,
        sentAt: null
      }
    });
  } catch {
    // Notification logging must not affect checkout success.
  }
}

function formatOrderCreatedMessage(order: NonNullable<OrderForNotification>) {
  const items = order.items.map((item, index) => {
    const note = item.noteSnapshot ? `\n   note: ${item.noteSnapshot}` : "";
    const customDrawing =
      item.customDrawingSurchargeKopecks > 0
        ? `\n   отрисовка: ${formatKopecks(item.customDrawingSurchargeKopecks)}`
        : "";
    const discount =
      item.discountKopecks > 0 ? `\n   скидка: -${formatKopecks(item.discountKopecks)}` : "";

    return [
      `${index + 1}. ${item.productNameSnapshot}`,
      `   ${item.itemTypeLabelSnapshot ?? itemTypeLabel(item.itemTypeSnapshot)}, ${item.sizeCmSnapshot} см x ${item.quantity}`,
      `   цена: ${formatKopecks(item.unitPriceKopecks)}, строка: ${formatKopecks(item.subtotalKopecks)}${note}${customDrawing}${discount}`
    ].join("\n");
  });

  const contactParts = [
    order.customerTelegramUsername ? `@${order.customerTelegramUsername}` : null,
    order.user?.username ? `@${order.user.username}` : null,
    order.customerContact,
    order.customerPhone
  ]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  return [
    "🆕 Новый заказ",
    "",
    `Заказ: ${order.publicNumber}`,
    `Статус: ${order.fulfillmentStatus}`,
    `Оплата: ${order.paymentStatus}`,
    "Оплата пока не подключена",
    "",
    "Состав:",
    ...items,
    "",
    `Товары: ${formatKopecks(order.itemsSubtotalKopecks)}`,
    `Отрисовка: ${formatKopecks(order.customDrawingKopecks)}`,
    `Скидка: -${formatKopecks(order.discountKopecks)}`,
    `Доставка: ${formatKopecks(order.deliveryKopecks)} (${deliveryMethodLabel(order.deliveryMethod)})`,
    `Итого: ${formatKopecks(order.totalKopecks)}`,
    "",
    `Получатель: ${order.customerName}`,
    `Контакт: ${contactParts.join(", ") || "не указан"}`,
    `Адрес: ${formatDeliveryAddress(order.deliveryAddress)}`,
    order.comment ? `Комментарий: ${order.comment}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function itemTypeLabel(itemType: ItemType) {
  if (itemType === "STANDARD") {
    return "Стандарт";
  }

  if (itemType === "PREMIUM") {
    return "Премиум";
  }

  return "Настенная панель";
}

function deliveryMethodLabel(method: string) {
  return method === "RUSSIAN_POST" ? "Почта России" : method;
}

function formatDeliveryAddress(address: NonNullable<OrderForNotification>["deliveryAddress"]) {
  if (!address) {
    return "не указан";
  }

  return (
    address.addressLine ||
    [
      address.postalCode,
      address.city,
      `ул. ${address.street}`,
      `д. ${address.house}`,
      address.apartment ? `кв. ${address.apartment}` : null
    ]
      .filter(Boolean)
      .join(", ")
  );
}

function formatKopecks(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value / 100))} ₽`;
}

