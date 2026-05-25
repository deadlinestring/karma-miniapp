import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { shouldSeedImageBeCover } from "./seed-image-policy.mjs";

const { Pool } = pg;

const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

if (!directDatabaseUrl) {
  throw new Error("DIRECT_DATABASE_URL is required to run database seed.");
}

const pool = new Pool({
  connectionString: directDatabaseUrl,
  max: 1
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STORE_SETTINGS_ID = "main";

const categories = [
  { name: "Аниме", slug: "anime", sortOrder: 10, subcategories: [
    { name: "Наруто", slug: "naruto", sortOrder: 10 },
    { name: "Атака титанов", slug: "attack-on-titan", sortOrder: 20 }
  ] },
  { name: "Игры", slug: "games", sortOrder: 20, subcategories: [
    { name: "Minecraft", slug: "minecraft", sortOrder: 10 },
    { name: "Cyberpunk 2077", slug: "cyberpunk-2077", sortOrder: 20 }
  ] },
  { name: "Фильмы", slug: "movies", sortOrder: 30, subcategories: [
    { name: "Гарри Поттер", slug: "harry-potter", sortOrder: 10 },
    { name: "Звёздные войны", slug: "star-wars", sortOrder: 20 }
  ] },
  { name: "Машины", slug: "cars", sortOrder: 40, subcategories: [
    { name: "BMW", slug: "bmw", sortOrder: 10 },
    { name: "Nissan", slug: "nissan", sortOrder: 20 }
  ] }
];

const products = [
  {
    name: "Наруто Узумаки",
    slug: "naruto-uzumaki",
    categorySlug: "anime",
    subcategorySlug: "naruto",
    description: "Яркий ночник с силуэтом Наруто и мягким тёплым свечением.",
    productType: "REGULAR",
    isFeatured: true,
    images: ["/images/mock/product-violet.svg", "/images/mock/product-cyan.svg", "/images/mock/product-pink.svg"]
  },
  {
    name: "Итачи Учиха",
    slug: "itachi-uchiha",
    categorySlug: "anime",
    subcategorySlug: "naruto",
    description: "Лаконичный световой силуэт с глубоким красно-фиолетовым настроением.",
    productType: "REGULAR",
    isFeatured: false,
    images: ["/images/mock/product-pink.svg", "/images/mock/product-violet.svg", "/images/mock/product-blue.svg"]
  },
  {
    name: "Леви Аккерман",
    slug: "levi-ackerman",
    categorySlug: "anime",
    subcategorySlug: "attack-on-titan",
    description: "Динамичная композиция для комнаты с характером и холодным светом.",
    productType: "REGULAR",
    isFeatured: true,
    images: ["/images/mock/product-blue.svg", "/images/mock/product-cyan.svg", "/images/mock/product-violet.svg"]
  },
  {
    name: "Крипер",
    slug: "creeper",
    categorySlug: "games",
    subcategorySlug: "minecraft",
    description: "Пиксельный ночник с узнаваемой игровой геометрией и мягким зелёным свечением.",
    productType: "REGULAR",
    isFeatured: false,
    images: ["/images/mock/product-cyan.svg", "/images/mock/product-blue.svg", "/images/mock/product-violet.svg"]
  },
  {
    name: "Samurai",
    slug: "samurai",
    categorySlug: "games",
    subcategorySlug: "cyberpunk-2077",
    description: "Неоновая панель в духе ночного города, музыки и технологичного бунта.",
    productType: "REGULAR",
    isFeatured: true,
    images: ["/images/mock/product-pink.svg", "/images/mock/product-blue.svg", "/images/mock/product-cyan.svg"]
  },
  {
    name: "Хогвартс",
    slug: "hogwarts",
    categorySlug: "movies",
    subcategorySlug: "harry-potter",
    description: "Атмосферный ночник с силуэтом замка и мягким сказочным свечением.",
    productType: "REGULAR",
    isFeatured: false,
    images: ["/images/mock/product-violet.svg", "/images/mock/product-blue.svg", "/images/mock/product-pink.svg"]
  },
  {
    name: "Дарт Вейдер",
    slug: "darth-vader",
    categorySlug: "movies",
    subcategorySlug: "star-wars",
    description: "Контрастная световая панель с тёмным силуэтом и холодным космическим акцентом.",
    productType: "REGULAR",
    isFeatured: false,
    images: ["/images/mock/product-blue.svg", "/images/mock/product-pink.svg", "/images/mock/product-cyan.svg"]
  },
  {
    name: "BMW M5",
    slug: "bmw-m5",
    categorySlug: "cars",
    subcategorySlug: "bmw",
    description: "Световая линия для фанатов быстрых седанов и гаражной эстетики.",
    productType: "REGULAR",
    isFeatured: true,
    images: ["/images/mock/product-cyan.svg", "/images/mock/product-blue.svg", "/images/mock/product-violet.svg"]
  },
  {
    name: "Nissan Skyline GT-R",
    slug: "nissan-skyline-gt-r",
    categorySlug: "cars",
    subcategorySlug: "nissan",
    description: "Ночная панель с японским настроением и выразительным контуром легенды.",
    productType: "REGULAR",
    isFeatured: false,
    images: ["/images/mock/product-blue.svg", "/images/mock/product-cyan.svg", "/images/mock/product-pink.svg"]
  },
  {
    name: "Свой дизайн",
    slug: "custom-design",
    categorySlug: "anime",
    subcategorySlug: "naruto",
    description: "Отправьте фото, арт или идею — мы подготовим дизайн специально для вас.",
    productType: "CUSTOM",
    isFeatured: true,
    images: ["/images/mock/product-custom.svg", "/images/mock/product-violet.svg", "/images/mock/product-cyan.svg"]
  }
];

const variants = [
  { itemType: "STANDARD", sizeCm: 20, priceKopecks: 249000 },
  { itemType: "STANDARD", sizeCm: 25, priceKopecks: 339000 },
  { itemType: "STANDARD", sizeCm: 30, priceKopecks: 429000 },
  { itemType: "PREMIUM", sizeCm: 25, priceKopecks: 449000 },
  { itemType: "PREMIUM", sizeCm: 30, priceKopecks: 549000 },
  { itemType: "PREMIUM", sizeCm: 40, priceKopecks: 699000 },
  { itemType: "WALL_PANEL", sizeCm: 35, priceKopecks: 599000 },
  { itemType: "WALL_PANEL", sizeCm: 45, priceKopecks: 749000 },
  { itemType: "WALL_PANEL", sizeCm: 55, priceKopecks: 899000 }
];

const storagePathFromUrl = (url) => url.replace(/^\/images\/mock\//, "mock/");

const seedImageId = (productSlug, index) =>
  `seed-image-${productSlug}-${index === 0 ? "cover" : `gallery-${index}`}`;

async function seedStoreSettings() {
  await prisma.storeSettings.upsert({
    where: { id: STORE_SETTINGS_ID },
    update: {
      storeName: "KARMA",
      subtitle: "кастомные светильники",
      heroTitle: "Ночник, который сделает комнату твоей",
      heroSubtitle: "Выбери любимого персонажа, автомобиль или создай свой дизайн",
      heroImageUrl: "/images/mock/hero-night-light.svg",
      contactText: "Свяжемся с вами после оформления заказа.",
      deliveryText: "Доставка рассчитывается после подтверждения макета."
    },
    create: {
      id: STORE_SETTINGS_ID,
      storeName: "KARMA",
      subtitle: "кастомные светильники",
      heroTitle: "Ночник, который сделает комнату твоей",
      heroSubtitle: "Выбери любимого персонажа, автомобиль или создай свой дизайн",
      heroImageUrl: "/images/mock/hero-night-light.svg",
      contactText: "Свяжемся с вами после оформления заказа.",
      deliveryText: "Доставка рассчитывается после подтверждения макета."
    }
  });
}

async function seedCategories() {
  const categoryBySlug = new Map();
  const subcategoryByKey = new Map();

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true
      },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true
      }
    });

    categoryBySlug.set(category.slug, savedCategory);

    for (const subcategory of category.subcategories) {
      const savedSubcategory = await prisma.subcategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: savedCategory.id,
            slug: subcategory.slug
          }
        },
        update: {
          name: subcategory.name,
          sortOrder: subcategory.sortOrder,
          isActive: true
        },
        create: {
          categoryId: savedCategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          sortOrder: subcategory.sortOrder,
          isActive: true
        }
      });

      subcategoryByKey.set(`${category.slug}:${subcategory.slug}`, savedSubcategory);
    }
  }

  return { categoryBySlug, subcategoryByKey };
}

async function seedProducts(categoryBySlug, subcategoryByKey) {
  for (const product of products) {
    const subcategory = subcategoryByKey.get(`${product.categorySlug}:${product.subcategorySlug}`);

    if (!categoryBySlug.get(product.categorySlug) || !subcategory) {
      throw new Error(`Missing category data for ${product.slug}`);
    }

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        subcategoryId: subcategory.id,
        name: product.name,
        description: product.description,
        productType: product.productType,
        isFeatured: product.isFeatured,
        isActive: true
      },
      create: {
        subcategoryId: subcategory.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        productType: product.productType,
        isFeatured: product.isFeatured,
        isActive: true
      },
      select: {
        id: true
      }
    });

    const existingCover = await prisma.productImage.findFirst({
      where: {
        productId: savedProduct.id,
        isCover: true
      },
      select: {
        id: true
      }
    });

    for (const [index, url] of product.images.entries()) {
      const imageId = seedImageId(product.slug, index);
      const isSeedCover = shouldSeedImageBeCover({
        imageIndex: index,
        existingCoverImageId: existingCover?.id ?? null,
        seedImageId: imageId
      });

      await prisma.productImage.upsert({
        where: { id: imageId },
        update: {
          productId: savedProduct.id,
          url,
          storagePath: storagePathFromUrl(url),
          altText: `${product.name} — изображение ${index + 1}`,
          isCover: isSeedCover,
          sortOrder: index
        },
        create: {
          id: imageId,
          productId: savedProduct.id,
          url,
          storagePath: storagePathFromUrl(url),
          altText: `${product.name} — изображение ${index + 1}`,
          isCover: isSeedCover,
          sortOrder: index
        }
      });
    }

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: {
          productId_itemType_sizeCm: {
            productId: savedProduct.id,
            itemType: variant.itemType,
            sizeCm: variant.sizeCm
          }
        },
        update: {
          priceKopecks: variant.priceKopecks,
          isActive: true
        },
        create: {
          productId: savedProduct.id,
          itemType: variant.itemType,
          sizeCm: variant.sizeCm,
          priceKopecks: variant.priceKopecks,
          isActive: true
        }
      });
    }
  }
}

async function main() {
  await seedStoreSettings();
  const { categoryBySlug, subcategoryByKey } = await seedCategories();
  await seedProducts(categoryBySlug, subcategoryByKey);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
