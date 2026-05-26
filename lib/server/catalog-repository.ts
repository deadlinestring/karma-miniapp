import "server-only";

import { prisma } from "@/lib/server/prisma";
import type {
  StorefrontCatalogData,
  StorefrontCategory,
  StorefrontHomeData,
  StorefrontImage,
  StorefrontItemType,
  StorefrontProduct,
  StorefrontSettings,
  StorefrontVariant
} from "@/lib/storefront-types";

const DEFAULT_SETTINGS: StorefrontSettings = {
  storeName: "KARMA",
  subtitle: "кастомные светильники",
  heroTitle: "Ночник, который сделает комнату твоей",
  heroSubtitle: "Выбери любимого персонажа, автомобиль или создай свой дизайн",
  logoUrl: null,
  heroImageUrl: "/images/mock/hero-night-light.svg"
};

const itemTypeLabels: Record<StorefrontItemType, string> = {
  STANDARD: "Стандарт",
  PREMIUM: "Премиум",
  WALL_PANEL: "Настенная панель"
};

const accentByIndex: StorefrontProduct["accent"][] = ["violet", "cyan", "blue", "pink"];

type ProductRecord = Awaited<ReturnType<typeof getProductRecords>>[number];

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "main" }
  });

  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  return {
    storeName: settings.storeName,
    subtitle: settings.subtitle,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    logoUrl: settings.logoUrl,
    heroImageUrl: settings.heroImageUrl
  };
}

export async function getStorefrontCategories(): Promise<StorefrontCategory[]> {
  const categories = await prisma.category.findMany({
    where: storefrontCategoryWhere(),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: {
        where: storefrontSubcategoryWhere(),
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
      }
    }
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    coverImageUrl: category.coverImageUrl,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      slug: subcategory.slug,
      coverImageUrl: subcategory.coverImageUrl
    }))
  }));
}

export function storefrontCategoryWhere() {
  return {
    isActive: true,
    subcategories: {
      some: storefrontSubcategoryWhere()
    }
  };
}

export function storefrontSubcategoryWhere() {
  return {
    isActive: true,
    products: { some: { isActive: true } }
  };
}

export async function getFeaturedStorefrontProducts(): Promise<StorefrontProduct[]> {
  const products = await getProductRecords({ isFeatured: true });

  return products.map(mapProductRecord);
}

export async function getStorefrontCatalog(): Promise<StorefrontCatalogData> {
  const categories = await getStorefrontCategories();
  const products = await getProductRecords();

  return {
    categories,
    products: products.map(mapProductRecord)
  };
}

export async function getStorefrontHomeData(): Promise<StorefrontHomeData> {
  const settings = await getStorefrontSettings();
  const categories = await getStorefrontCategories();
  const featuredProducts = await getFeaturedStorefrontProducts();
  const catalogProducts = await getProductRecords();
  const mappedProducts = catalogProducts.map(mapProductRecord);

  return {
    settings,
    categories,
    featuredProducts,
    customProduct: mappedProducts.find((product) => product.isCustom) ?? null
  };
}

export async function getStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
      subcategory: {
        isActive: true,
        category: { isActive: true }
      }
    },
    select: productSelect()
  });

  return product ? mapProductRecord(product) : null;
}

async function getProductRecords(where: { isFeatured?: boolean } = {}) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: where.isFeatured,
      subcategory: {
        isActive: true,
        category: { isActive: true }
      }
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
    select: productSelect()
  });
}

function productSelect() {
  return {
    id: true,
    slug: true,
    name: true,
    description: true,
    productType: true,
    isFeatured: true,
    createdAt: true,
    subcategory: {
      include: {
        category: true
      }
    },
    images: {
      orderBy: [{ sortOrder: "asc" as const }]
    },
    priceList: {
      select: {
        id: true,
        isActive: true,
        items: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: "asc" as const },
            { itemType: "asc" as const },
            { sizeCm: "asc" as const }
          ],
          select: {
            id: true,
            itemType: true,
            sizeCm: true,
            priceKopecks: true,
            note: true,
            sortOrder: true
          }
        }
      }
    }
  };
}

export function mapProductRecord(product: ProductRecord): StorefrontProduct {
  const images = product.images.map<StorefrontImage>((image) => ({
    id: image.id,
    url: image.url,
    storagePath: image.storagePath,
    altText: image.altText,
    isCover: image.isCover,
    sortOrder: image.sortOrder
  }));
  const cover = images.find((image) => image.isCover) ?? images[0];
  const priceItems = product.priceList?.isActive ? product.priceList.items : [];
  const variants = priceItems.map<StorefrontVariant>((item) => ({
    priceListItemId: item.id,
    itemType: item.itemType,
    itemTypeLabel: itemTypeLabels[item.itemType],
    sizeCm: item.sizeCm,
    sizeLabel: `${item.sizeCm} см`,
    priceKopecks: item.priceKopecks,
    note: item.note,
    sortOrder: item.sortOrder
  }));
  const minPriceKopecks = variants.reduce(
    (minPrice, variant) => Math.min(minPrice, variant.priceKopecks),
    variants[0]?.priceKopecks ?? 0
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    productType: product.productType,
    category: product.subcategory.category.name,
    categorySlug: product.subcategory.category.slug,
    subcategory: product.subcategory.name,
    subcategorySlug: product.subcategory.slug,
    coverImage: cover?.url ?? "/images/mock/product-custom.svg",
    galleryImages: images.map((image) => image.url),
    images,
    isFeatured: product.isFeatured,
    isCustom: product.productType === "CUSTOM",
    variants,
    minPriceKopecks,
    isOrderAvailable: variants.length > 0,
    accent: accentByIndex[Math.abs(hashString(product.slug)) % accentByIndex.length],
    motif: product.subcategory.name
  };
}

function hashString(value: string) {
  return Array.from(value).reduce((hash, char) => hash + char.charCodeAt(0), 0);
}
