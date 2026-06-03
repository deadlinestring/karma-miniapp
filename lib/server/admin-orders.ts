import "server-only";

import type { CustomImageReviewStatus, FulfillmentStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { createPrivateCustomOrderImageSignedUrl } from "@/lib/server/supabase-storage";

type PrismaLike = typeof prisma;
type CustomImageSignedUrlResult = {
  signedUrl: string;
  expiresInSeconds: number;
};

export type AdminOrderStatusFilter = "all" | FulfillmentStatus;

export type AdminOrderListFilters = {
  status?: string | null;
  paymentStatus?: string | null;
  search?: string | null;
  page?: number | string | null;
  pageSize?: number | string | null;
};

export type AdminOrderListItem = {
  publicNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentStatusLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  totalKopecks: number;
  deliveryAmountKopecks: number;
  discountAmountKopecks: number;
  itemsCount: number;
  customerDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  deliveryMethod: string;
  customer: {
    name: string;
    phone: string;
    fallbackContact: string | null;
    telegramUsername: string | null;
    telegramFirstName: string | null;
    telegramLastName: string | null;
  };
  deliveryAddress: {
    city: string;
    addressLine: string | null;
    street: string;
    house: string;
    apartment: string | null;
    postalCode: string | null;
    comment: string | null;
  } | null;
  comment: string | null;
  adminNotes: string | null;
  items: Array<{
    productName: string;
    productSlug: string | null;
    priceListItemId: string | null;
    itemType: string;
    itemTypeLabel: string;
    sizeCm: number;
    unitPriceKopecks: number;
    quantity: number;
    lineSubtotalKopecks: number;
    discountKopecks: number;
    lineTotalKopecks: number;
    note: string | null;
    customDrawingSurchargeKopecks: number;
    customDrawingStyle: string | null;
    hasCustomImage: boolean;
    customImageReviewStatus: CustomImageReviewStatus;
    customImageReviewComment: string | null;
  }>;
  notificationSummary: {
    successCount: number;
    failedCount: number;
    lastSentAt: string | null;
  };
  allowedNextStatuses: Array<{
    value: FulfillmentStatus;
    label: string;
  }>;
};

export type AdminOrderListResult = {
  items: AdminOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminOrderServices = {
  db: PrismaLike;
  createCustomImageSignedUrl: (storagePath: string) => Promise<CustomImageSignedUrlResult>;
};

const defaultServices: AdminOrderServices = {
  db: prisma,
  createCustomImageSignedUrl: (storagePath) => createPrivateCustomOrderImageSignedUrl(storagePath)
};
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export const adminFulfillmentStatuses: FulfillmentStatus[] = [
  "NEW",
  "IN_WORK",
  "MANUFACTURED",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED"
];

const allFulfillmentStatuses = new Set<FulfillmentStatus>([
  "NEW",
  "AWAITING_PAYMENT",
  "PAID",
  "IN_WORK",
  "MANUFACTURED",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED"
]);

const allPaymentStatuses = new Set<PaymentStatus>(["PENDING", "PAID", "CANCELLED", "FAILED"]);

const allowedTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  NEW: ["IN_WORK", "CANCELLED"],
  AWAITING_PAYMENT: [],
  PAID: [],
  IN_WORK: ["MANUFACTURED", "SHIPPED", "CANCELLED"],
  MANUFACTURED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: []
};

export async function getAdminOrders(filters: AdminOrderListFilters = {}) {
  return getAdminOrdersWithServices(filters, defaultServices);
}

export async function getAdminOrder(publicNumber: string) {
  return getAdminOrderWithServices(publicNumber, defaultServices);
}

export async function updateAdminOrderFulfillmentStatus(publicNumber: string, input: unknown) {
  return updateAdminOrderFulfillmentStatusWithServices(publicNumber, input, defaultServices);
}

export async function getAdminOrderCustomImageSignedUrl(publicNumber: string) {
  return getAdminOrderCustomImageSignedUrlWithServices(publicNumber, defaultServices);
}

export async function updateAdminOrderCustomImageReview(publicNumber: string, input: unknown) {
  return updateAdminOrderCustomImageReviewWithServices(publicNumber, input, defaultServices);
}

export async function getAdminOrdersWithServices(
  filters: AdminOrderListFilters,
  services: AdminOrderServices
): Promise<AdminOrderListResult> {
  const pageSize = readPageSize(filters.pageSize);
  const page = readPage(filters.page);
  const where = buildOrderListWhere(filters);
  const [total, orders] = await Promise.all([
    services.db.order.count({ where }),
    services.db.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: adminOrderListSelect()
    })
  ]);

  return {
    items: orders.map(mapAdminOrderListItem),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getAdminOrderWithServices(
  publicNumber: string,
  services: AdminOrderServices
): Promise<AdminOrderDetail> {
  const order = await services.db.order.findUnique({
    where: { publicNumber: readPublicNumber(publicNumber) },
    select: adminOrderDetailSelect()
  });

  if (!order) {
    throw new Error("order_not_found");
  }

  return mapAdminOrderDetail(order);
}

export async function updateAdminOrderFulfillmentStatusWithServices(
  publicNumber: string,
  input: unknown,
  services: AdminOrderServices
) {
  const payload = readStatusUpdateInput(input);
  const orderPublicNumber = readPublicNumber(publicNumber);
  const current = await services.db.order.findUnique({
    where: { publicNumber: orderPublicNumber },
    select: {
      publicNumber: true,
      fulfillmentStatus: true
    }
  });

  if (!current) {
    throw new Error("order_not_found");
  }

  assertAllowedTransition(current.fulfillmentStatus, payload.fulfillmentStatus);

  await services.db.order.update({
    where: { publicNumber: orderPublicNumber },
    data: { fulfillmentStatus: payload.fulfillmentStatus },
    select: { publicNumber: true }
  });

  return getAdminOrderWithServices(orderPublicNumber, services);
}

export async function getAdminOrderCustomImageSignedUrlWithServices(
  publicNumber: string,
  services: AdminOrderServices
) {
  const customItem = await findCustomOrderItem(readPublicNumber(publicNumber), services);
  const signed = await services.createCustomImageSignedUrl(customItem.customImageStoragePath);

  return {
    signedUrl: signed.signedUrl,
    expiresInSeconds: signed.expiresInSeconds
  };
}

export async function updateAdminOrderCustomImageReviewWithServices(
  publicNumber: string,
  input: unknown,
  services: AdminOrderServices
) {
  const payload = readCustomImageReviewInput(input);
  const orderPublicNumber = readPublicNumber(publicNumber);
  const customItem = await findCustomOrderItem(orderPublicNumber, services);

  if (customItem.customImageReviewStatus !== "PENDING_REVIEW") {
    throw new Error("forbidden_custom_image_review_transition");
  }

  await services.db.orderItem.update({
    where: { id: customItem.id },
    data: {
      customImageReviewStatus: payload.status,
      customImageReviewComment: payload.reason
    },
    select: { id: true }
  });

  return getAdminOrderWithServices(orderPublicNumber, services);
}

function buildOrderListWhere(filters: AdminOrderListFilters) {
  const where: Record<string, unknown> = {};
  const status = readOptionalFulfillmentStatus(filters.status);
  const paymentStatus = readOptionalPaymentStatus(filters.paymentStatus);
  const search = typeof filters.search === "string" ? filters.search.trim() : "";

  if (status && status !== "all") {
    where.fulfillmentStatus = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (search) {
    where.OR = [
      { publicNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } }
    ];
  }

  return where;
}

function adminOrderListSelect() {
  return {
    publicNumber: true,
    fulfillmentStatus: true,
    paymentStatus: true,
    totalKopecks: true,
    deliveryKopecks: true,
    discountKopecks: true,
    customerName: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: { items: true }
    }
  };
}

function adminOrderDetailSelect() {
  return {
    ...adminOrderListSelect(),
    customerPhone: true,
    customerTelegramUsername: true,
    customerTelegramFirstName: true,
    customerTelegramLastName: true,
    customerContact: true,
    comment: true,
    adminNotes: true,
    itemsSubtotalKopecks: true,
    customDrawingKopecks: true,
    deliveryMethod: true,
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
    items: {
      orderBy: { createdAt: "asc" as const },
      select: {
        productNameSnapshot: true,
        productSlugSnapshot: true,
        priceListItemId: true,
        itemTypeSnapshot: true,
        itemTypeLabelSnapshot: true,
        sizeCmSnapshot: true,
        unitPriceKopecks: true,
        baseSubtotalKopecks: true,
        customDrawingSurchargeKopecks: true,
        customDrawingStyle: true,
        customImageStoragePath: true,
        customImageReviewStatus: true,
        customImageReviewComment: true,
        discountKopecks: true,
        quantity: true,
        subtotalKopecks: true,
        noteSnapshot: true
      }
    },
    notificationLogs: {
      select: {
        type: true,
        sentAt: true
      }
    }
  };
}

type AdminOrderListRecord = {
  publicNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  totalKopecks: number;
  deliveryKopecks: number;
  discountKopecks: number;
  customerName: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { items: number };
};

type AdminOrderDetailRecord = AdminOrderListRecord & {
  customerPhone: string;
  customerTelegramUsername: string | null;
  customerTelegramFirstName: string | null;
  customerTelegramLastName: string | null;
  customerContact: string | null;
  comment: string | null;
  adminNotes: string | null;
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  deliveryMethod: string;
  deliveryAddress: AdminOrderDetail["deliveryAddress"];
  items: Array<{
    productNameSnapshot: string;
    productSlugSnapshot: string | null;
    priceListItemId: string | null;
    itemTypeSnapshot: string;
    itemTypeLabelSnapshot: string | null;
    sizeCmSnapshot: number;
    unitPriceKopecks: number;
    baseSubtotalKopecks: number;
    customDrawingSurchargeKopecks: number;
    customDrawingStyle: string | null;
    customImageStoragePath: string | null;
    customImageReviewStatus: CustomImageReviewStatus;
    customImageReviewComment: string | null;
    discountKopecks: number;
    quantity: number;
    subtotalKopecks: number;
    noteSnapshot: string | null;
  }>;
  notificationLogs: Array<{
    type: string;
    sentAt: Date | null;
  }>;
};

function mapAdminOrderListItem(order: AdminOrderListRecord): AdminOrderListItem {
  return {
    publicNumber: order.publicNumber,
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillmentStatusLabel: fulfillmentStatusLabel(order.fulfillmentStatus),
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: paymentStatusLabel(order.paymentStatus),
    totalKopecks: order.totalKopecks,
    deliveryAmountKopecks: order.deliveryKopecks,
    discountAmountKopecks: order.discountKopecks,
    itemsCount: order._count.items,
    customerDisplayName: order.customerName,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}

function mapAdminOrderDetail(order: AdminOrderDetailRecord): AdminOrderDetail {
  const listItem = mapAdminOrderListItem(order);
  const successLogs = order.notificationLogs.filter((log) => log.type === "ORDER_CREATED_ADMIN" && log.sentAt);
  const failedLogs = order.notificationLogs.filter((log) => log.type === "ORDER_CREATED_ADMIN_FAILED");
  const lastSentAt =
    successLogs
      .map((log) => log.sentAt)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    ...listItem,
    itemsSubtotalKopecks: order.itemsSubtotalKopecks,
    customDrawingKopecks: order.customDrawingKopecks,
    deliveryMethod: order.deliveryMethod,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      fallbackContact: order.customerContact,
      telegramUsername: order.customerTelegramUsername,
      telegramFirstName: order.customerTelegramFirstName,
      telegramLastName: order.customerTelegramLastName
    },
    deliveryAddress: order.deliveryAddress,
    comment: order.comment,
    adminNotes: order.adminNotes,
    items: order.items.map((item) => ({
      productName: item.productNameSnapshot,
      productSlug: item.productSlugSnapshot,
      priceListItemId: item.priceListItemId,
      itemType: item.itemTypeSnapshot,
      itemTypeLabel: item.itemTypeLabelSnapshot ?? itemTypeLabel(item.itemTypeSnapshot),
      sizeCm: item.sizeCmSnapshot,
      unitPriceKopecks: item.unitPriceKopecks,
      quantity: item.quantity,
      lineSubtotalKopecks: item.baseSubtotalKopecks,
      discountKopecks: item.discountKopecks,
      lineTotalKopecks: item.subtotalKopecks,
      note: item.noteSnapshot,
      customDrawingSurchargeKopecks: item.customDrawingSurchargeKopecks,
      customDrawingStyle: item.customDrawingStyle,
      hasCustomImage: Boolean(item.customImageStoragePath),
      customImageReviewStatus: item.customImageReviewStatus,
      customImageReviewComment: item.customImageReviewComment
    })),
    notificationSummary: {
      successCount: successLogs.length,
      failedCount: failedLogs.length,
      lastSentAt: lastSentAt ? lastSentAt.toISOString() : null
    },
    allowedNextStatuses: (allowedTransitions[order.fulfillmentStatus] ?? []).map((value) => ({
      value,
      label: fulfillmentStatusLabel(value)
    }))
  };
}

async function findCustomOrderItem(publicNumber: string, services: AdminOrderServices) {
  const order = await services.db.order.findUnique({
    where: { publicNumber },
    select: {
      publicNumber: true,
      items: {
        where: {
          customImageStoragePath: { not: null }
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          customImageStoragePath: true,
          customImageReviewStatus: true
        }
      }
    }
  });

  if (!order) {
    throw new Error("order_not_found");
  }

  const item = order.items[0];

  if (!item?.customImageStoragePath) {
    throw new Error("custom_image_not_found");
  }

  return {
    id: item.id,
    customImageStoragePath: item.customImageStoragePath,
    customImageReviewStatus: item.customImageReviewStatus
  };
}

function readCustomImageReviewInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("invalid_custom_image_review_payload");
  }

  const payload = input as Record<string, unknown>;
  const allowedKeys = new Set(["status", "reason"]);

  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) {
    throw new Error("forbidden_custom_image_review_field");
  }

  if (payload.status !== "APPROVED" && payload.status !== "REJECTED") {
    throw new Error("invalid_custom_image_review_status");
  }

  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";

  if (payload.status === "REJECTED" && reason.length < 2) {
    throw new Error("custom_image_reject_reason_required");
  }

  if (reason.length > 300) {
    throw new Error("custom_image_reject_reason_too_long");
  }

  return {
    status: payload.status as Extract<CustomImageReviewStatus, "APPROVED" | "REJECTED">,
    reason: reason || null
  };
}

function readStatusUpdateInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("invalid_status_payload");
  }

  const payload = input as Record<string, unknown>;
  const allowedKeys = new Set(["fulfillmentStatus"]);

  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) {
    throw new Error("forbidden_order_field");
  }

  if (typeof payload.fulfillmentStatus !== "string" || !allFulfillmentStatuses.has(payload.fulfillmentStatus as FulfillmentStatus)) {
    throw new Error("invalid_fulfillment_status");
  }

  return { fulfillmentStatus: payload.fulfillmentStatus as FulfillmentStatus };
}

function assertAllowedTransition(current: FulfillmentStatus, next: FulfillmentStatus) {
  if (current === next) {
    return;
  }

  if (!(allowedTransitions[current] ?? []).includes(next)) {
    throw new Error("forbidden_status_transition");
  }
}

function readOptionalFulfillmentStatus(value: unknown): AdminOrderStatusFilter | null {
  if (value === undefined || value === null || value === "" || value === "all") {
    return "all";
  }

  return typeof value === "string" && allFulfillmentStatuses.has(value as FulfillmentStatus)
    ? (value as FulfillmentStatus)
    : "all";
}

function readOptionalPaymentStatus(value: unknown): PaymentStatus | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return typeof value === "string" && allPaymentStatuses.has(value as PaymentStatus)
    ? (value as PaymentStatus)
    : null;
}

function readPublicNumber(value: unknown) {
  if (typeof value !== "string" || !/^KRM-\d{8}-[A-Z0-9]{6}$/.test(value.trim())) {
    throw new Error("invalid_order_number");
  }

  return value.trim();
}

function readPage(value: AdminOrderListFilters["page"]) {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function readPageSize(value: AdminOrderListFilters["pageSize"]) {
  const pageSize = Number(value ?? DEFAULT_PAGE_SIZE);

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(pageSize, MAX_PAGE_SIZE);
}

export function fulfillmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    NEW: "Новый",
    AWAITING_PAYMENT: "Ожидает оплаты",
    PAID: "Оплачен",
    IN_WORK: "В работе",
    MANUFACTURED: "Изготовлен",
    SHIPPED: "Отправлен",
    COMPLETED: "Завершён",
    CANCELLED: "Отменён"
  };

  return labels[status] ?? status;
}

export function paymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    PENDING: "Ожидает",
    PAID: "Оплачен",
    CANCELLED: "Отменён",
    FAILED: "Ошибка"
  };

  return labels[status];
}

function itemTypeLabel(itemType: string) {
  const labels: Record<string, string> = {
    STANDARD: "Стандарт",
    PREMIUM: "Премиум",
    WALL_PANEL: "Настенная панель"
  };

  return labels[itemType] ?? itemType;
}
