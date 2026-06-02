import "server-only";

import { prisma } from "@/lib/server/prisma";

export type FaqSectionDto = {
  id: string;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
};

type FaqSectionInput = {
  slug?: unknown;
  title?: unknown;
  content?: unknown;
  sortOrder?: unknown;
  isActive?: unknown;
};

type FaqSectionCreateUpdate = {
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
};

type FaqServices = {
  faqSection: {
    findMany: (args?: any) => Promise<FaqSectionDto[]>;
    upsert: (args: any) => unknown;
  };
  $transaction: <T>(operations: T[]) => Promise<unknown>;
};

const titleMaxLength = 120;
const contentMaxLength = 4000;

export const DEFAULT_FAQ_SECTIONS: FaqSectionDto[] = [
  {
    id: "fallback-about",
    slug: "about-karma-lights",
    title: "Что такое светильники KARMA",
    content:
      "KARMA делает кастомные ночники и настенные панели по любимым персонажам, авто и своим идеям. Каждый товар использует общий реальный прайс, а детали заказа сохраняются в карточке заказа.",
    sortOrder: 10,
    isActive: true
  },
  {
    id: "fallback-order",
    slug: "how-to-order",
    title: "Как оформить заказ",
    content:
      "Выберите товар, тип изделия и размер, добавьте его в корзину и заполните checkout внутри Telegram Mini App. После оформления заказ появится в разделе Мои заказы.",
    sortOrder: 20,
    isActive: true
  },
  {
    id: "fallback-types",
    slug: "sizes-and-types",
    title: "Размеры и виды",
    content:
      "Стандарт: 20 и 25 см. Премиум: 25 и 30 см. Настенная панель: 30, 35, 40, 45, 50 и 55 см. Панель 55 см включает двойную подсветку сверху и снизу.",
    sortOrder: 30,
    isActive: true
  },
  {
    id: "fallback-custom",
    slug: "custom-image-order",
    title: "Заказ по своей картинке",
    content:
      "Можно заказать светильник по своей картинке. Изображение проходит проверку администратором перед оплатой, потому что не каждое фото хорошо подходит для светильника.",
    sortOrder: 40,
    isActive: true
  },
  {
    id: "fallback-styles",
    slug: "drawing-styles",
    title: "Стили отрисовки и доплаты",
    content:
      "Стиль №1 «Линиями» +690 ₽.\nСтиль №2 «Линии + заливка основных элементов» +790 ₽.\nСтиль №3 «Линии + заливка + полутона, тени, блики» +990 ₽.",
    sortOrder: 50,
    isActive: true
  },
  {
    id: "fallback-image",
    slug: "image-requirements",
    title: "Требования к изображению",
    content:
      "Лучше подходят чёткие изображения без сильной размытой тени, водяных знаков и мелких нечитаемых деталей. Если сомневаетесь, отправьте картинку менеджеру через поддержку.",
    sortOrder: 60,
    isActive: true
  },
  {
    id: "fallback-delivery",
    slug: "russian-post-delivery",
    title: "Доставка Почтой России",
    content:
      "Доставка Почтой России считается отдельно: 450 ₽ для заказов только со стандартными и премиум-ночниками, 550 ₽ если в заказе есть настенная панель.",
    sortOrder: 70,
    isActive: true
  },
  {
    id: "fallback-support",
    slug: "order-support",
    title: "Как связаться по заказу",
    content:
      "На странице заказа нажмите Связаться. Откроется support bot @karmashopsupportbot, подключённый к BlueSales, а менеджер увидит контекст по публичному номеру заказа.",
    sortOrder: 80,
    isActive: true
  }
];

const knownFallbackSlugs = new Set(DEFAULT_FAQ_SECTIONS.map((section) => section.slug));

export async function getPublicFaqSections() {
  return getPublicFaqSectionsWithServices(prisma);
}

export async function getPublicFaqSectionsWithServices(services: Pick<FaqServices, "faqSection">) {
  try {
    const sections = await services.faqSection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
    });

    return sections.length > 0 ? sections.map(mapFaqSection) : DEFAULT_FAQ_SECTIONS;
  } catch {
    return DEFAULT_FAQ_SECTIONS;
  }
}

export async function getAdminFaqSections() {
  return getAdminFaqSectionsWithServices(prisma);
}

export async function getAdminFaqSectionsWithServices(services: Pick<FaqServices, "faqSection">) {
  try {
    const sections = await services.faqSection.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
    });

    return sections.length > 0 ? sections.map(mapFaqSection) : DEFAULT_FAQ_SECTIONS;
  } catch {
    return DEFAULT_FAQ_SECTIONS;
  }
}

export async function updateAdminFaqSections(input: unknown) {
  return updateAdminFaqSectionsWithServices(input, prisma);
}

export async function updateAdminFaqSectionsWithServices(input: unknown, services: FaqServices) {
  const sections = validateFaqSectionsInput(input);

  await services.$transaction(
    sections.map((section) =>
      services.faqSection.upsert({
        where: { slug: section.slug },
        create: section,
        update: {
          title: section.title,
          content: section.content,
          sortOrder: section.sortOrder,
          isActive: section.isActive
        }
      })
    )
  );

  return getAdminFaqSectionsWithServices(services);
}

export function validateFaqSectionsInput(input: unknown) {
  if (!input || typeof input !== "object" || !Array.isArray((input as { sections?: unknown }).sections)) {
    throw new Error("invalid_faq_payload");
  }

  const seenSlugs = new Set<string>();
  const sections = (input as { sections: unknown[] }).sections;

  if (sections.length === 0 || sections.length > 20) {
    throw new Error("invalid_faq_payload");
  }

  return sections.map((section): FaqSectionCreateUpdate => {
    if (!section || typeof section !== "object") {
      throw new Error("invalid_faq_payload");
    }

    const value = section as FaqSectionInput;
    const slug = readSlug(value.slug);

    if (!knownFallbackSlugs.has(slug)) {
      throw new Error("invalid_faq_payload");
    }

    if (seenSlugs.has(slug)) {
      throw new Error("invalid_faq_payload");
    }

    seenSlugs.add(slug);

    return {
      slug,
      title: readText(value.title, titleMaxLength, true),
      content: readText(value.content, contentMaxLength, true),
      sortOrder: readSortOrder(value.sortOrder),
      isActive: typeof value.isActive === "boolean" ? value.isActive : true
    };
  });
}

function mapFaqSection(section: FaqSectionDto): FaqSectionDto {
  return {
    id: section.id,
    slug: section.slug,
    title: section.title,
    content: section.content,
    sortOrder: section.sortOrder,
    isActive: section.isActive
  };
}

function readSlug(value: unknown) {
  const slug = typeof value === "string" ? value.trim() : "";

  if (!/^[a-z0-9-]{3,80}$/.test(slug)) {
    throw new Error("invalid_faq_payload");
  }

  return slug;
}

function readText(value: unknown, maxLength: number, required: boolean) {
  const text = typeof value === "string" ? value.trim() : "";

  if ((required && !text) || text.length > maxLength) {
    throw new Error("invalid_faq_payload");
  }

  return text;
}

function readSortOrder(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10000) {
    throw new Error("invalid_faq_payload");
  }

  return value;
}
