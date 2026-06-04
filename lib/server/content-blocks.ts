import "server-only";

import { prisma } from "@/lib/server/prisma";

export type ContentBlockDto = {
  id: string;
  slug: string;
  page: string | null;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ContentBlockInput = {
  slug?: unknown;
  page?: unknown;
  title?: unknown;
  body?: unknown;
  ctaLabel?: unknown;
  ctaHref?: unknown;
  sortOrder?: unknown;
  isActive?: unknown;
};

type ContentBlockCreateUpdate = {
  slug: string;
  page: string | null;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ContentBlockServices = {
  contentBlock: {
    findMany: (args?: any) => Promise<ContentBlockDto[]>;
    upsert: (args: any) => unknown;
  };
  $transaction: <T>(operations: T[]) => Promise<unknown>;
};

const titleMaxLength = 120;
const bodyMaxLength = 2000;
const ctaLabelMaxLength = 80;
const ctaHrefMaxLength = 240;
const pageMaxLength = 80;

export const DEFAULT_CONTENT_BLOCKS: ContentBlockDto[] = [
  {
    id: "draft-checkout-delivery-help",
    slug: "checkout-delivery-help",
    page: "checkout",
    title: "Доставка Почтой России",
    body: "Доставка считается отдельно: 450 ₽ для заказов без настенной панели и 550 ₽, если в заказе есть настенная панель.",
    ctaLabel: null,
    ctaHref: null,
    sortOrder: 10,
    isActive: true
  },
  {
    id: "draft-checkout-custom-review-help",
    slug: "checkout-custom-review-help",
    page: "checkout",
    title: "Свой дизайн проверит администратор",
    body: "Если в заказе есть свой дизайн, изображение будет проверено перед подтверждением и оплатой.",
    ctaLabel: "Подробнее в FAQ",
    ctaHref: "/faq",
    sortOrder: 20,
    isActive: true
  },
  {
    id: "draft-payment-disabled-guidance",
    slug: "payment-disabled-guidance",
    page: "orders",
    title: "Онлайн-оплата скоро появится",
    body: "Сейчас менеджер подтвердит заказ и подскажет способ оплаты.",
    ctaLabel: null,
    ctaHref: null,
    sortOrder: 30,
    isActive: true
  },
  {
    id: "draft-payment-pending-guidance",
    slug: "payment-pending-guidance",
    page: "orders",
    title: "Ожидает оплаты",
    body: "Когда оплата будет доступна или подтверждена, статус заказа обновится на этой странице.",
    ctaLabel: null,
    ctaHref: null,
    sortOrder: 40,
    isActive: true
  },
  {
    id: "draft-custom-design-help",
    slug: "custom-design-help",
    page: "product",
    title: "Свой дизайн по картинке",
    body: "Выберите стиль отрисовки и загрузите изображение. После заказа администратор проверит макет и свяжется с вами.",
    ctaLabel: "Как проходит заказ?",
    ctaHref: "/faq",
    sortOrder: 50,
    isActive: true
  },
  {
    id: "draft-support-cta",
    slug: "support-cta",
    page: "orders",
    title: "Нужно изменить заказ?",
    body: "Напишите нам по заказу. Менеджер ответит в Telegram.",
    ctaLabel: "Связаться",
    ctaHref: null,
    sortOrder: 60,
    isActive: true
  },
  {
    id: "draft-orders-empty-state",
    slug: "orders-empty-state",
    page: "orders",
    title: "У вас пока нет заказов.",
    body: "После оформления заказа здесь появятся его статус, состав и итоговая сумма.",
    ctaLabel: "Перейти в каталог",
    ctaHref: "/catalog",
    sortOrder: 70,
    isActive: true
  }
];

const knownContentBlockSlugs = new Set(DEFAULT_CONTENT_BLOCKS.map((block) => block.slug));

export async function getPublicContentBlocks(slugs?: string[]) {
  return getPublicContentBlocksWithServices(slugs, prisma);
}

export async function getPublicContentBlocksWithServices(
  slugs: string[] | undefined,
  services: Pick<ContentBlockServices, "contentBlock">
) {
  const requestedSlugs = sanitizeRequestedSlugs(slugs);

  try {
    const blocks = await services.contentBlock.findMany({
      where: requestedSlugs.length > 0 ? { slug: { in: requestedSlugs } } : undefined,
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }]
    });

    return mergeContentBlocksWithDefaults(blocks.map(mapContentBlock), requestedSlugs).filter((block) => block.isActive);
  } catch {
    return DEFAULT_CONTENT_BLOCKS.filter((block) => requestedSlugs.length === 0 || requestedSlugs.includes(block.slug));
  }
}

export async function getAdminContentBlocks() {
  return getAdminContentBlocksWithServices(prisma);
}

export async function getAdminContentBlocksWithServices(services: Pick<ContentBlockServices, "contentBlock">) {
  try {
    const blocks = await services.contentBlock.findMany({
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }]
    });

    return mergeContentBlocksWithDefaults(blocks.map(mapContentBlock));
  } catch {
    return DEFAULT_CONTENT_BLOCKS;
  }
}

export async function updateAdminContentBlocks(input: unknown) {
  return updateAdminContentBlocksWithServices(input, prisma);
}

export async function updateAdminContentBlocksWithServices(input: unknown, services: ContentBlockServices) {
  const blocks = validateContentBlocksInput(input);

  await services.$transaction(
    blocks.map((block) =>
      services.contentBlock.upsert({
        where: { slug: block.slug },
        create: block,
        update: {
          page: block.page,
          title: block.title,
          body: block.body,
          ctaLabel: block.ctaLabel,
          ctaHref: block.ctaHref,
          sortOrder: block.sortOrder,
          isActive: block.isActive
        }
      })
    )
  );

  return getAdminContentBlocksWithServices(services);
}

export function validateContentBlocksInput(input: unknown) {
  if (!input || typeof input !== "object" || !Array.isArray((input as { blocks?: unknown }).blocks)) {
    throw new Error("invalid_content_blocks_payload");
  }

  const seenSlugs = new Set<string>();
  const blocks = (input as { blocks: unknown[] }).blocks;

  if (blocks.length === 0 || blocks.length > DEFAULT_CONTENT_BLOCKS.length) {
    throw new Error("invalid_content_blocks_payload");
  }

  return blocks.map((block): ContentBlockCreateUpdate => {
    if (!block || typeof block !== "object") {
      throw new Error("invalid_content_blocks_payload");
    }

    const value = block as ContentBlockInput;
    const slug = readSlug(value.slug);

    if (!knownContentBlockSlugs.has(slug) || seenSlugs.has(slug)) {
      throw new Error("invalid_content_blocks_payload");
    }

    seenSlugs.add(slug);

    return {
      slug,
      page: readOptionalText(value.page, pageMaxLength),
      title: readOptionalText(value.title, titleMaxLength),
      body: readOptionalText(value.body, bodyMaxLength),
      ctaLabel: readOptionalText(value.ctaLabel, ctaLabelMaxLength),
      ctaHref: readOptionalHref(value.ctaHref),
      sortOrder: readSortOrder(value.sortOrder),
      isActive: typeof value.isActive === "boolean" ? value.isActive : true
    };
  });
}

function mapContentBlock(block: ContentBlockDto): ContentBlockDto {
  return {
    id: block.id,
    slug: block.slug,
    page: block.page,
    title: block.title,
    body: block.body,
    ctaLabel: block.ctaLabel,
    ctaHref: block.ctaHref,
    sortOrder: block.sortOrder,
    isActive: block.isActive
  };
}

function mergeContentBlocksWithDefaults(blocks: ContentBlockDto[], requestedSlugs: string[] = []) {
  const allowedDefaults = requestedSlugs.length > 0
    ? DEFAULT_CONTENT_BLOCKS.filter((block) => requestedSlugs.includes(block.slug))
    : DEFAULT_CONTENT_BLOCKS;
  const bySlug = new Map<string, ContentBlockDto>();

  for (const block of allowedDefaults) {
    bySlug.set(block.slug, block);
  }

  for (const block of blocks) {
    if (knownContentBlockSlugs.has(block.slug) && (requestedSlugs.length === 0 || requestedSlugs.includes(block.slug))) {
      bySlug.set(block.slug, block);
    }
  }

  return Array.from(bySlug.values()).sort((left, right) => left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug));
}

function sanitizeRequestedSlugs(slugs?: string[]) {
  if (!slugs) {
    return [];
  }

  return Array.from(new Set(slugs.map((slug) => slug.trim()).filter((slug) => knownContentBlockSlugs.has(slug))));
}

function readSlug(value: unknown) {
  const slug = typeof value === "string" ? value.trim() : "";

  if (!/^[a-z0-9-]{3,80}$/.test(slug)) {
    throw new Error("invalid_content_blocks_payload");
  }

  return slug;
}

function readOptionalText(value: unknown, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";

  if (text.length > maxLength) {
    throw new Error("invalid_content_blocks_payload");
  }

  return text || null;
}

function readOptionalHref(value: unknown) {
  const href = readOptionalText(value, ctaHrefMaxLength);

  if (!href) {
    return null;
  }

  if (!href.startsWith("/") && !href.startsWith("https://t.me/")) {
    throw new Error("invalid_content_blocks_payload");
  }

  return href;
}

function readSortOrder(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10000) {
    throw new Error("invalid_content_blocks_payload");
  }

  return value;
}
