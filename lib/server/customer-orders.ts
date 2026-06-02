import "server-only";

import type {
  CustomDrawingStyle,
  CustomImageReviewStatus,
  FulfillmentStatus,
  PaymentStatus
} from "@prisma/client";
import type { TelegramAuthUser } from "@/lib/server/telegram-auth";
import { prisma } from "@/lib/server/prisma";

type PrismaLike = typeof prisma;

export type CustomerOrderListItem = {
  publicNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentStatusLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  totalKopecks: number;
  itemsCount: number;
  itemSummary: string[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerOrderDetail = CustomerOrderListItem & {
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  discountKopecks: number;
  deliveryKopecks: number;
  deliveryMethod: string;
  customer: {
    name: string;
    phone: string;
    fallbackContact: string | null;
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
  items: Array<{
    productName: string;
    productSlug: string | null;
    itemType: string;
    itemTypeLabel: string;
    sizeCm: number;
    unitPriceKopecks: number;
    quantity: number;
    lineSubtotalKopecks: number;
    discountKopecks: number;
    lineTotalKopecks: number;
    note: string | null;
    customDrawingStyle: CustomDrawingStyle | null;
    customDrawingSurchargeKopecks: number;
    customImageReviewStatus: CustomImageReviewStatus;
  }>;
};

export type CustomerOrderListResult = {
  items: CustomerOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CustomerOrderServices = {
  db: PrismaLike;
};

const defaultServices: CustomerOrderServices = { db: prisma };
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function getCustomerOrders(
  telegramUser: TelegramAuthUser,
  params: { page?: string | number | null; pageSize?: string | number | null } = {}
) {
  return getCustomerOrdersWithServices(telegramUser, params, defaultServices);
}

export async function getCustomerOrder(publicNumber: string, telegramUser: TelegramAuthUser) {
  return getCustomerOrderWithServices(publicNumber, telegramUser, defaultServices);
}

export async function getCustomerOrdersWithServices(
  telegramUser: TelegramAuthUser,
  params: { page?: string | number | null; pageSize?: string | number | null },
  services: CustomerOrderServices
): Promise<CustomerOrderListResult> {
  const user = await findTelegramUser(telegramUser, services);
  const page = readPage(params.page);
  const pageSize = readPageSize(params.pageSize);

  if (!user) {
    return { items: [], page, pageSize, total: 0, totalPages: 1 };
  }

  const where = { userId: user.id };
  const [total, orders] = await Promise.all([
    services.db.order.count({ where }),
    services.db.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: customerOrderListSelect()
    })
  ]);

  return {
    items: orders.map(mapCustomerOrderListItem),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getCustomerOrderWithServices(
  publicNumber: string,
  telegramUser: TelegramAuthUser,
  services: CustomerOrderServices
): Promise<CustomerOrderDetail | null> {
  const orderPublicNumber = readPublicNumber(publicNumber);
  const user = await findTelegramUser(telegramUser, services);

  if (!user) {
    return null;
  }

  const order = await services.db.order.findFirst({
    where: {
      publicNumber: orderPublicNumber,
      userId: user.id
    },
    select: customerOrderDetailSelect()
  });

  return order ? mapCustomerOrderDetail(order) : null;
}

async function findTelegramUser(telegramUser: TelegramAuthUser, services: CustomerOrderServices) {
  return services.db.telegramUser.findUnique({
    where: { telegramId: BigInt(telegramUser.id) },
    select: { id: true }
  });
}

function customerOrderListSelect() {
  return {
    publicNumber: true,
    fulfillmentStatus: true,
    paymentStatus: true,
    totalKopecks: true,
    createdAt: true,
    updatedAt: true,
    items: {
      orderBy: { createdAt: "asc" as const },
      take: 3,
      select: {
        productNameSnapshot: true,
        quantity: true
      }
    },
    _count: {
      select: { items: true }
    }
  };
}

function customerOrderDetailSelect() {
  return {
    ...customerOrderListSelect(),
    customerName: true,
    customerPhone: true,
    customerContact: true,
    comment: true,
    itemsSubtotalKopecks: true,
    customDrawingKopecks: true,
    deliveryMethod: true,
    deliveryKopecks: true,
    discountKopecks: true,
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
        itemTypeSnapshot: true,
        itemTypeLabelSnapshot: true,
        sizeCmSnapshot: true,
        unitPriceKopecks: true,
        baseSubtotalKopecks: true,
        discountKopecks: true,
        quantity: true,
        subtotalKopecks: true,
        noteSnapshot: true,
        customDrawingStyle: true,
        customDrawingSurchargeKopecks: true,
        customImageReviewStatus: true
      }
    }
  };
}

type CustomerOrderListRecord = {
  publicNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  totalKopecks: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
  }>;
  _count: { items: number };
};

type CustomerOrderDetailRecord = Omit<CustomerOrderListRecord, "items"> & {
  customerName: string;
  customerPhone: string;
  customerContact: string | null;
  comment: string | null;
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  deliveryMethod: string;
  deliveryKopecks: number;
  discountKopecks: number;
  deliveryAddress: CustomerOrderDetail["deliveryAddress"];
  items: Array<{
    productNameSnapshot: string;
    productSlugSnapshot: string | null;
    itemTypeSnapshot: string;
    itemTypeLabelSnapshot: string | null;
    sizeCmSnapshot: number;
    unitPriceKopecks: number;
    baseSubtotalKopecks: number;
    discountKopecks: number;
    quantity: number;
    subtotalKopecks: number;
    noteSnapshot: string | null;
    customDrawingStyle: CustomDrawingStyle | null;
    customDrawingSurchargeKopecks: number;
    customImageReviewStatus: CustomImageReviewStatus;
  }>;
};

function mapCustomerOrderListItem(order: CustomerOrderListRecord): CustomerOrderListItem {
  return {
    publicNumber: order.publicNumber,
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillmentStatusLabel: fulfillmentStatusLabel(order.fulfillmentStatus),
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: paymentStatusLabel(order.paymentStatus),
    totalKopecks: order.totalKopecks,
    itemsCount: order._count.items,
    itemSummary: order.items.map((item) =>
      item.quantity > 1 ? `${item.productNameSnapshot} x ${item.quantity}` : item.productNameSnapshot
    ),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}

function mapCustomerOrderDetail(order: CustomerOrderDetailRecord): CustomerOrderDetail {
  const listItem = mapCustomerOrderListItem({
    publicNumber: order.publicNumber,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentStatus: order.paymentStatus,
    totalKopecks: order.totalKopecks,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      productNameSnapshot: item.productNameSnapshot,
      quantity: item.quantity
    })),
    _count: order._count
  });

  return {
    ...listItem,
    itemsSubtotalKopecks: order.itemsSubtotalKopecks,
    customDrawingKopecks: order.customDrawingKopecks,
    discountKopecks: order.discountKopecks,
    deliveryKopecks: order.deliveryKopecks,
    deliveryMethod: order.deliveryMethod,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      fallbackContact: order.customerContact
    },
    deliveryAddress: order.deliveryAddress,
    comment: order.comment,
    items: order.items.map((item) => ({
      productName: item.productNameSnapshot,
      productSlug: item.productSlugSnapshot,
      itemType: item.itemTypeSnapshot,
      itemTypeLabel: item.itemTypeLabelSnapshot ?? itemTypeLabel(item.itemTypeSnapshot),
      sizeCm: item.sizeCmSnapshot,
      unitPriceKopecks: item.unitPriceKopecks,
      quantity: item.quantity,
      lineSubtotalKopecks: item.baseSubtotalKopecks,
      discountKopecks: item.discountKopecks,
      lineTotalKopecks: item.subtotalKopecks,
      note: item.noteSnapshot,
      customDrawingStyle: item.customDrawingStyle,
      customDrawingSurchargeKopecks: item.customDrawingSurchargeKopecks,
      customImageReviewStatus: item.customImageReviewStatus
    }))
  };
}

function readPublicNumber(value: unknown) {
  if (typeof value !== "string" || !/^KRM-\d{8}-[A-Z0-9]{6}$/.test(value.trim())) {
    throw new Error("invalid_order_number");
  }

  return value.trim();
}

function readPage(value: string | number | null | undefined) {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function readPageSize(value: string | number | null | undefined) {
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
    PENDING: "Оплата пока не подключена",
    PAID: "Оплачен",
    CANCELLED: "Отменён",
    FAILED: "Ошибка оплаты"
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
