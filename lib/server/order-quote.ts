import "server-only";

import type { ItemType, ProductType } from "@prisma/client";
import {
  calculateOrderPricing,
  type CustomDrawingStyle,
  type OrderPricingItemType
} from "@/lib/server/order-pricing";
import { prisma } from "@/lib/server/prisma";

type PrismaLike = typeof prisma;

export type OrderQuoteServices = {
  db: Pick<PrismaLike, "product">;
};

export type OrderQuoteInput = {
  items: Array<{
    productId: string;
    priceListItemId: string;
    quantity: number;
    custom?: {
      drawingStyle?: CustomDrawingStyle | null;
      customDesignKey?: string | null;
      customImageStoragePath?: string | null;
      customImageFileName?: string | null;
    } | null;
  }>;
  deliveryMethod: "RUSSIAN_POST";
};

export type OrderQuoteItem = {
  productId: string;
  productName: string;
  productSlug: string;
  priceListItemId: string;
  itemType: OrderPricingItemType;
  itemTypeLabel: string;
  sizeCm: number;
  quantity: number;
  unitPriceKopecks: number;
  lineSubtotalKopecks: number;
  note: string | null;
  customDrawingStyle: CustomDrawingStyle | null;
  customDesignKey: string | null;
  customImageStoragePath: string | null;
  customImageFileName: string | null;
  customDrawingSurchargeKopecks: number;
  discountKopecks: number;
  lineTotalKopecks: number;
};

export type OrderQuoteResult = {
  items: OrderQuoteItem[];
  summary: {
    itemsSubtotalKopecks: number;
    customDrawingTotalKopecks: number;
    deliveryMethod: "RUSSIAN_POST";
    deliveryAmountKopecks: number;
    discountAmountKopecks: number;
    totalKopecks: number;
  };
  warnings: string[];
};

type ProductRecord = NonNullable<Awaited<ReturnType<typeof getQuoteProductRecords>>[number]>;

const defaultServices: OrderQuoteServices = { db: prisma };
const MAX_ITEMS = 50;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;
const MAX_CUSTOM_DESIGN_KEY_LENGTH = 120;
const MAX_CUSTOM_IMAGE_STORAGE_PATH_LENGTH = 240;
const MAX_CUSTOM_IMAGE_FILE_NAME_LENGTH = 120;
const deliveryMethods = new Set(["RUSSIAN_POST"]);
const customDrawingStyles = new Set<CustomDrawingStyle>([
  "CUSTOM_DRAWING_STYLE_1",
  "CUSTOM_DRAWING_STYLE_2",
  "CUSTOM_DRAWING_STYLE_3"
]);

const itemTypeLabels: Record<OrderPricingItemType, string> = {
  STANDARD: "Стандарт",
  PREMIUM: "Премиум",
  WALL_PANEL: "Настенная панель"
};

export class OrderQuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderQuoteError";
  }
}

export async function quoteOrder(input: unknown) {
  return quoteOrderWithServices(input, defaultServices);
}

export async function quoteOrderWithServices(
  input: unknown,
  services: OrderQuoteServices
): Promise<OrderQuoteResult> {
  const payload = parseQuoteInput(input);
  const productIds = Array.from(new Set(payload.items.map((item) => item.productId)));
  const products = await getQuoteProductRecords(productIds, services);
  const productsById = new Map(products.map((product) => [product.id, product]));

  const normalizedItems = payload.items.map((item, index) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new OrderQuoteError("Товар недоступен для заказа.");
    }

    validateProductForQuote(product);

    const priceListItem = product.priceList?.items.find(
      (candidate) => candidate.id === item.priceListItemId
    );

    if (!priceListItem) {
      throw new OrderQuoteError("Выбранный вариант товара недоступен.");
    }

    const customDrawingStyle = item.custom?.drawingStyle ?? null;
    const customDesignKey = item.custom?.customDesignKey?.trim() ?? null;
    const customImageStoragePath = item.custom?.customImageStoragePath?.trim() ?? null;
    const customImageFileName = item.custom?.customImageFileName?.trim() ?? null;

    validateCustomQuoteState(product.productType, {
      customDrawingStyle,
      customDesignKey,
      customImageStoragePath
    });

    return {
      lineId: `${item.productId}:${item.priceListItemId}:${index}`,
      product,
      priceListItem,
      quantity: item.quantity,
      customDrawingStyle,
      customDesignKey,
      customImageStoragePath,
      customImageFileName
    };
  });

  const pricing = calculateOrderPricing(
    normalizedItems.map((item) => ({
      lineId: item.lineId,
      itemType: item.priceListItem.itemType,
      unitPriceKopecks: item.priceListItem.priceKopecks,
      quantity: item.quantity,
      customDrawingStyle: item.customDrawingStyle,
      customDesignKey: item.customDesignKey
    }))
  );

  const items = normalizedItems.map<OrderQuoteItem>((item, index) => {
    const line = pricing.lines[index];

    return {
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      priceListItemId: item.priceListItem.id,
      itemType: item.priceListItem.itemType,
      itemTypeLabel: itemTypeLabels[item.priceListItem.itemType],
      sizeCm: item.priceListItem.sizeCm,
      quantity: item.quantity,
      unitPriceKopecks: item.priceListItem.priceKopecks,
      lineSubtotalKopecks: line.baseSubtotalKopecks,
      note: item.priceListItem.note,
      customDrawingStyle: item.customDrawingStyle,
      customDesignKey: item.customDesignKey,
      customImageStoragePath: item.customImageStoragePath,
      customImageFileName: item.customImageFileName,
      customDrawingSurchargeKopecks: line.customDrawingSurchargeKopecks,
      discountKopecks: line.discountKopecks,
      lineTotalKopecks: line.lineTotalKopecks
    };
  });

  return {
    items,
    summary: {
      itemsSubtotalKopecks: pricing.itemsSubtotalKopecks,
      customDrawingTotalKopecks: pricing.customDrawingKopecks,
      deliveryMethod: payload.deliveryMethod,
      deliveryAmountKopecks: pricing.deliveryKopecks,
      discountAmountKopecks: pricing.discountKopecks,
      totalKopecks: pricing.totalKopecks
    },
    warnings: []
  };
}

async function getQuoteProductRecords(productIds: string[], services: OrderQuoteServices) {
  return services.db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      productType: true,
      isActive: true,
      subcategory: {
        select: {
          isActive: true,
          category: { select: { isActive: true } }
        }
      },
      images: {
        where: { isCover: true },
        select: { id: true }
      },
      priceList: {
        select: {
          id: true,
          isActive: true,
          items: {
            where: { isActive: true },
            select: {
              id: true,
              itemType: true,
              sizeCm: true,
              priceKopecks: true,
              note: true
            }
          }
        }
      }
    }
  });
}

function parseQuoteInput(input: unknown): OrderQuoteInput {
  if (!input || typeof input !== "object") {
    throw new OrderQuoteError("Передайте данные корзины.");
  }

  const payload = input as Partial<OrderQuoteInput>;

  if (!deliveryMethods.has(String(payload.deliveryMethod))) {
    throw new OrderQuoteError("Сейчас доступна только доставка Почтой России.");
  }

  if (!Array.isArray(payload.items)) {
    throw new OrderQuoteError("Передайте товары для расчёта.");
  }

  if (payload.items.length === 0) {
    throw new OrderQuoteError("Корзина пуста.");
  }

  if (payload.items.length > MAX_ITEMS) {
    throw new OrderQuoteError("В корзине слишком много позиций.");
  }

  return {
    deliveryMethod: "RUSSIAN_POST",
    items: payload.items.map(parseQuoteItem)
  };
}

function parseQuoteItem(item: unknown): OrderQuoteInput["items"][number] {
  if (!item || typeof item !== "object") {
    throw new OrderQuoteError("Позиция корзины заполнена неверно.");
  }

  const candidate = item as {
    productId?: unknown;
    priceListItemId?: unknown;
    quantity?: unknown;
    custom?: unknown;
  };

  if (typeof candidate.productId !== "string" || candidate.productId.trim().length === 0) {
    throw new OrderQuoteError("Не указан товар.");
  }

  if (
    typeof candidate.priceListItemId !== "string" ||
    candidate.priceListItemId.trim().length === 0
  ) {
    throw new OrderQuoteError("Не указан вариант товара.");
  }

  if (
    typeof candidate.quantity !== "number" ||
    !Number.isInteger(candidate.quantity) ||
    candidate.quantity < MIN_QUANTITY ||
    candidate.quantity > MAX_QUANTITY
  ) {
    throw new OrderQuoteError("Количество товара должно быть от 1 до 99.");
  }

  return {
    productId: candidate.productId.trim(),
    priceListItemId: candidate.priceListItemId.trim(),
    quantity: candidate.quantity,
    custom: parseCustomQuoteInput(candidate.custom)
  };
}

function parseCustomQuoteInput(input: unknown): OrderQuoteInput["items"][number]["custom"] {
  if (input === undefined || input === null) {
    return null;
  }

  if (typeof input !== "object") {
    throw new OrderQuoteError("Параметры своего дизайна заполнены неверно.");
  }

  const custom = input as {
    drawingStyle?: unknown;
    customDesignKey?: unknown;
    customImageStoragePath?: unknown;
    customImageFileName?: unknown;
  };
  const drawingStyle = custom.drawingStyle;
  const customDesignKey =
    typeof custom.customDesignKey === "string" ? custom.customDesignKey.trim() : null;
  const customImageStoragePath =
    typeof custom.customImageStoragePath === "string" ? custom.customImageStoragePath.trim() : null;
  const customImageFileName =
    typeof custom.customImageFileName === "string" ? custom.customImageFileName.trim() : null;

  if (drawingStyle === undefined || drawingStyle === null || drawingStyle === "") {
    if (customDesignKey || customImageStoragePath || customImageFileName) {
      throw new OrderQuoteError("Для своего дизайна выберите стиль отрисовки.");
    }

    return null;
  }

  if (typeof drawingStyle !== "string" || !customDrawingStyles.has(drawingStyle as CustomDrawingStyle)) {
    throw new OrderQuoteError("Выбранный стиль отрисовки недоступен.");
  }

  if (!customDesignKey) {
    throw new OrderQuoteError("Для своего дизайна нужен идентификатор изображения.");
  }

  if (customDesignKey.length > MAX_CUSTOM_DESIGN_KEY_LENGTH) {
    throw new OrderQuoteError("Идентификатор своего дизайна слишком длинный.");
  }

  if (!customImageStoragePath) {
    throw new OrderQuoteError("Загрузите изображение для своего дизайна.");
  }

  if (
    customImageStoragePath.length > MAX_CUSTOM_IMAGE_STORAGE_PATH_LENGTH ||
    !customImageStoragePath.startsWith("custom-orders/")
  ) {
    throw new OrderQuoteError("Изображение своего дизайна нужно загрузить заново.");
  }

  if (customImageFileName && customImageFileName.length > MAX_CUSTOM_IMAGE_FILE_NAME_LENGTH) {
    throw new OrderQuoteError("Название файла своего дизайна слишком длинное.");
  }

  return {
    drawingStyle: drawingStyle as CustomDrawingStyle,
    customDesignKey,
    customImageStoragePath,
    customImageFileName
  };
}

function validateCustomQuoteState(
  productType: ProductType,
  custom: {
    customDrawingStyle: CustomDrawingStyle | null;
    customDesignKey: string | null;
    customImageStoragePath: string | null;
  }
) {
  const hasCustomPayload =
    Boolean(custom.customDrawingStyle) ||
    Boolean(custom.customDesignKey) ||
    Boolean(custom.customImageStoragePath);

  if (productType === "CUSTOM") {
    if (!custom.customDrawingStyle || !custom.customDesignKey || !custom.customImageStoragePath) {
      throw new OrderQuoteError("Для своего дизайна выберите стиль отрисовки и загрузите изображение.");
    }

    return;
  }

  if (hasCustomPayload) {
    throw new OrderQuoteError("Параметры своего дизайна доступны только для товара «Свой дизайн».");
  }
}

function validateProductForQuote(product: ProductRecord) {
  if (!product.isActive) {
    throw new OrderQuoteError("Товар недоступен для заказа.");
  }

  if (!product.subcategory.isActive) {
    throw new OrderQuoteError("Выбранная подкатегория скрыта.");
  }

  if (!product.subcategory.category.isActive) {
    throw new OrderQuoteError("Выбранная категория скрыта.");
  }

  if (!product.priceList?.isActive || product.priceList.items.length === 0) {
    throw new OrderQuoteError("Для товара не назначен активный прайс.");
  }

  if (product.productType === ("REGULAR" satisfies ProductType) && product.images.length !== 1) {
    throw new OrderQuoteError("Товар временно недоступен для заказа.");
  }
}
