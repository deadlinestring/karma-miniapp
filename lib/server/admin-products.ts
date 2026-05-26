import "server-only";

import { prisma } from "@/lib/server/prisma";
import { createSlug } from "@/lib/server/admin-categories";
import { deletePublicProductImage, isManagedProductImagePath, uploadPublicProductImage } from "@/lib/server/supabase-storage";
import type { ValidatedAdminImageFile } from "@/lib/server/upload-validation";
import type { ProductType } from "@prisma/client";

type PrismaLike = typeof prisma;

export type AdminProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  sortOrder: number;
};

export type AdminProductTaxonomy = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type AdminProductPriceList = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  activeItemCount: number;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productType: ProductType;
  isActive: boolean;
  isFeatured: boolean;
  category: AdminProductTaxonomy;
  subcategory: AdminProductTaxonomy;
  priceList: AdminProductPriceList | null;
  coverImage: AdminProductImage | null;
  galleryImageCount: number;
  updatedAt: string;
};

export type AdminProduct = AdminProductListItem & {
  subcategoryId: string;
  images: AdminProductImage[];
  readiness: {
    hasCover: boolean;
    categoryActive: boolean;
    subcategoryActive: boolean;
    priceListActive: boolean;
    priceListHasItems: boolean;
    canPublish: boolean;
  };
};

export type AdminProductListResult = {
  items: AdminProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminProductListFilters = {
  search?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  status?: "all" | "active" | "hidden" | "featured" | null;
  page?: number | string | null;
  pageSize?: number | string | null;
};

export type DeleteProductImageResult = {
  product: AdminProduct;
  storageCleanupAttempted: boolean;
  storageCleanupFailed: boolean;
};

type ProductRecord = Awaited<ReturnType<typeof getProductRecordById>>;
type ProductListRecord = NonNullable<ProductRecord>;

export type AdminProductServices = {
  db: PrismaLike;
  uploadImage: typeof uploadPublicProductImage;
  deleteImage: typeof deletePublicProductImage;
};

const defaultServices: AdminProductServices = {
  db: prisma,
  uploadImage: uploadPublicProductImage,
  deleteImage: deletePublicProductImage
};

const MAIN_PRICE_LIST_ID = "main";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 1;
const MAX_DESCRIPTION_LENGTH = 2000;
const productTypes = new Set<ProductType>(["REGULAR", "CUSTOM"]);

export async function getAdminProducts(filters: AdminProductListFilters = {}) {
  return getAdminProductsWithServices(filters, defaultServices);
}

export async function getAdminProduct(productId: string) {
  return getAdminProductWithServices(productId, defaultServices);
}

export async function createAdminProduct(input: unknown) {
  return createAdminProductWithServices(input, defaultServices);
}

export async function updateAdminProduct(productId: string, input: unknown) {
  return updateAdminProductWithServices(productId, input, defaultServices);
}

export async function addAdminProductGalleryImage(productId: string, image: ValidatedAdminImageFile) {
  return addAdminProductGalleryImageWithServices(productId, image, defaultServices);
}

export async function uploadAdminProductCoverImage(productId: string, image: ValidatedAdminImageFile) {
  return uploadAdminProductCoverImageWithServices(productId, image, defaultServices);
}

export async function setAdminProductCoverImage(productId: string, imageId: string) {
  return setAdminProductCoverImageWithServices(productId, imageId, defaultServices);
}

export async function deleteAdminProductImage(productId: string, imageId: string) {
  return deleteAdminProductImageWithServices(productId, imageId, defaultServices);
}

export async function getAdminProductsWithServices(
  filters: AdminProductListFilters,
  services: AdminProductServices
): Promise<AdminProductListResult> {
  const pageSize = readPageSize(filters.pageSize);
  const page = readPage(filters.page);
  const where = buildProductListWhere(filters);
  const [total, products] = await Promise.all([
    services.db.product.count({ where }),
    services.db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: adminProductSelect()
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: products.map(mapAdminProductListItem),
    page,
    pageSize,
    total,
    totalPages
  };
}

export async function getAdminProductWithServices(productId: string, services: AdminProductServices): Promise<AdminProduct> {
  const product = await getProductRecordById(productId, services.db);

  if (!product) {
    throw new Error("product_not_found");
  }

  return mapAdminProduct(product);
}

export async function createAdminProductWithServices(input: unknown, services: AdminProductServices) {
  const payload = readCreateInput(input);
  const subcategory = await readSubcategory(payload.subcategoryId, services.db);
  const priceList = await readMainPriceList(services.db);

  if (!subcategory) {
    throw new Error("subcategory_not_found");
  }

  if (!priceList || !priceList.isActive || priceList.items.length === 0) {
    throw new Error("main_price_list_not_ready");
  }

  const slug = createSlug(payload.name);
  const existing = await services.db.product.findUnique({ where: { slug }, select: { id: true } });

  if (existing) {
    throw new Error("product_slug_exists");
  }

  const product = await services.db.product.create({
    data: {
      name: payload.name,
      slug,
      description: payload.description,
      subcategoryId: subcategory.id,
      priceListId: MAIN_PRICE_LIST_ID,
      productType: payload.productType,
      isActive: false,
      isFeatured: false
    },
    select: { id: true }
  });

  return getAdminProductWithServices(product.id, services);
}

export async function updateAdminProductWithServices(
  productId: string,
  input: unknown,
  services: AdminProductServices
): Promise<AdminProduct> {
  const payload = readUpdateInput(input);
  const current = await getProductRecordById(productId, services.db);

  if (!current) {
    throw new Error("product_not_found");
  }

  const nextSubcategoryId = payload.subcategoryId ?? current.subcategoryId;
  const nextSubcategory =
    payload.subcategoryId !== undefined ? await readSubcategory(payload.subcategoryId, services.db) : current.subcategory;

  if (!nextSubcategory) {
    throw new Error("subcategory_not_found");
  }

  const nextIsActive = payload.isActive ?? current.isActive;

  if (payload.isFeatured === true && !nextIsActive) {
    throw new Error("featured_requires_active_product");
  }

  const nextIsFeatured = nextIsActive ? payload.isFeatured ?? current.isFeatured : false;

  if (nextIsActive) {
    assertProductCanPublish(current, nextSubcategory);
  }

  await services.db.product.update({
    where: { id: current.id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.subcategoryId !== undefined ? { subcategoryId: nextSubcategoryId } : {}),
      ...(payload.productType !== undefined ? { productType: payload.productType } : {}),
      ...(payload.isActive !== undefined ? { isActive: nextIsActive } : {}),
      ...(payload.isFeatured !== undefined || payload.isActive === false ? { isFeatured: nextIsFeatured } : {})
    }
  });

  return getAdminProductWithServices(current.id, services);
}

export async function addAdminProductGalleryImageWithServices(
  productId: string,
  image: ValidatedAdminImageFile,
  services: AdminProductServices
) {
  const product = await ensureProductExists(productId, services.db);
  const uploaded = await services.uploadImage({
    productId: product.id,
    buffer: image.buffer,
    contentType: image.contentType,
    extension: image.extension
  });

  try {
    const nextSortOrder = await getNextImageSortOrder(product.id, services.db);
    await services.db.productImage.create({
      data: {
        productId: product.id,
        url: uploaded.publicUrl,
        storagePath: uploaded.storagePath,
        altText: product.name,
        isCover: false,
        sortOrder: nextSortOrder
      }
    });
  } catch (error) {
    await services.deleteImage(product.id, uploaded.storagePath).catch(() => undefined);
    throw error;
  }

  return getAdminProductWithServices(product.id, services);
}

export async function uploadAdminProductCoverImageWithServices(
  productId: string,
  image: ValidatedAdminImageFile,
  services: AdminProductServices
) {
  const product = await ensureProductExists(productId, services.db);
  const uploaded = await services.uploadImage({
    productId: product.id,
    buffer: image.buffer,
    contentType: image.contentType,
    extension: image.extension
  });

  try {
    const nextSortOrder = await getNextImageSortOrder(product.id, services.db);
    await services.db.$transaction(async (tx) => {
      await tx.productImage.updateMany({
        where: { productId: product.id, isCover: true },
        data: { isCover: false }
      });
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: uploaded.publicUrl,
          storagePath: uploaded.storagePath,
          altText: product.name,
          isCover: true,
          sortOrder: nextSortOrder
        }
      });
    });
  } catch (error) {
    await services.deleteImage(product.id, uploaded.storagePath).catch(() => undefined);
    throw error;
  }

  return getAdminProductWithServices(product.id, services);
}

export async function setAdminProductCoverImageWithServices(
  productId: string,
  imageId: string,
  services: AdminProductServices
) {
  await ensureImageBelongsToProduct(productId, imageId, services.db);

  await services.db.$transaction(async (tx) => {
    await tx.productImage.updateMany({
      where: { productId, isCover: true },
      data: { isCover: false }
    });
    await tx.productImage.update({
      where: { id: imageId },
      data: { isCover: true }
    });
  });

  return getAdminProductWithServices(productId, services);
}

export async function deleteAdminProductImageWithServices(
  productId: string,
  imageId: string,
  services: AdminProductServices
): Promise<DeleteProductImageResult> {
  const image = await ensureImageBelongsToProduct(productId, imageId, services.db);

  if (image.isCover) {
    throw new Error("cannot_delete_cover_image");
  }

  await services.db.productImage.delete({ where: { id: image.id } });

  let storageCleanupAttempted = false;
  let storageCleanupFailed = false;

  const managedStoragePath = isManagedProductImagePath(productId, image.storagePath) ? image.storagePath : null;

  if (managedStoragePath) {
    storageCleanupAttempted = true;
    try {
      await services.deleteImage(productId, managedStoragePath);
    } catch {
      storageCleanupFailed = true;
    }
  }

  return {
    product: await getAdminProductWithServices(productId, services),
    storageCleanupAttempted,
    storageCleanupFailed
  };
}

function buildProductListWhere(filters: AdminProductListFilters) {
  const where: Record<string, unknown> = {};
  const search = typeof filters.search === "string" ? filters.search.trim() : "";

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (filters.subcategoryId) {
    where.subcategoryId = filters.subcategoryId;
  } else if (filters.categoryId) {
    where.subcategory = { categoryId: filters.categoryId };
  }

  if (filters.status === "active") {
    where.isActive = true;
  } else if (filters.status === "hidden") {
    where.isActive = false;
  } else if (filters.status === "featured") {
    where.isFeatured = true;
  }

  return where;
}

async function getProductRecordById(productId: string, db: PrismaLike) {
  return db.product.findUnique({
    where: { id: productId },
    select: adminProductSelect()
  });
}

async function ensureProductExists(productId: string, db: PrismaLike) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true }
  });

  if (!product) {
    throw new Error("product_not_found");
  }

  return product;
}

async function readSubcategory(subcategoryId: string, db: PrismaLike) {
  return db.subcategory.findUnique({
    where: { id: subcategoryId },
    select: {
      id: true,
      isActive: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true
        }
      }
    }
  });
}

async function readMainPriceList(db: PrismaLike) {
  return db.priceList.findUnique({
    where: { id: MAIN_PRICE_LIST_ID },
    select: {
      id: true,
      isActive: true,
      items: {
        where: { isActive: true },
        select: { id: true }
      }
    }
  });
}

async function ensureImageBelongsToProduct(productId: string, imageId: string, db: PrismaLike) {
  const image = await db.productImage.findFirst({
    where: { id: imageId, productId }
  });

  if (!image) {
    throw new Error("image_not_found");
  }

  return image;
}

async function getNextImageSortOrder(productId: string, db: PrismaLike) {
  const aggregate = await db.productImage.aggregate({
    where: { productId },
    _max: { sortOrder: true }
  });

  return (aggregate._max.sortOrder ?? 0) + 10;
}

function assertProductCanPublish(product: ProductListRecord, nextSubcategory: NonNullable<Awaited<ReturnType<typeof readSubcategory>>>) {
  const coverCount = product.images.filter((image) => image.isCover).length;

  if (!nextSubcategory.isActive) {
    throw new Error("subcategory_inactive");
  }

  if (!nextSubcategory.category.isActive) {
    throw new Error("category_inactive");
  }

  if (!product.priceList?.isActive || product.priceList.items.length === 0) {
    throw new Error("price_list_not_ready");
  }

  if (coverCount !== 1) {
    throw new Error("cover_required");
  }
}

function adminProductSelect() {
  return {
    id: true,
    name: true,
    slug: true,
    description: true,
    productType: true,
    isActive: true,
    isFeatured: true,
    subcategoryId: true,
    updatedAt: true,
    createdAt: true,
    subcategory: {
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    },
    priceList: {
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        items: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    },
    images: {
      orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
      select: {
        id: true,
        url: true,
        altText: true,
        isCover: true,
        sortOrder: true
      }
    }
  };
}

function mapAdminProductListItem(product: ProductListRecord): AdminProductListItem {
  const images = mapAdminImages(product.images);
  const coverImage = images.find((image) => image.isCover) ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    productType: product.productType,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    category: product.subcategory.category,
    subcategory: {
      id: product.subcategory.id,
      name: product.subcategory.name,
      slug: product.subcategory.slug,
      isActive: product.subcategory.isActive
    },
    priceList: product.priceList
      ? {
          id: product.priceList.id,
          name: product.priceList.name,
          slug: product.priceList.slug,
          isActive: product.priceList.isActive,
          activeItemCount: product.priceList.items.length
        }
      : null,
    coverImage,
    galleryImageCount: images.filter((image) => !image.isCover).length,
    updatedAt: product.updatedAt.toISOString()
  };
}

function mapAdminProduct(product: ProductListRecord): AdminProduct {
  const listItem = mapAdminProductListItem(product);
  const images = mapAdminImages(product.images);
  const hasCover = images.filter((image) => image.isCover).length === 1;
  const categoryActive = product.subcategory.category.isActive;
  const subcategoryActive = product.subcategory.isActive;
  const priceListActive = Boolean(product.priceList?.isActive);
  const priceListHasItems = Boolean(product.priceList?.items.length);

  return {
    ...listItem,
    subcategoryId: product.subcategoryId,
    images,
    readiness: {
      hasCover,
      categoryActive,
      subcategoryActive,
      priceListActive,
      priceListHasItems,
      canPublish: hasCover && categoryActive && subcategoryActive && priceListActive && priceListHasItems
    }
  };
}

function mapAdminImages(images: ProductListRecord["images"]): AdminProductImage[] {
  return images
    .map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      isCover: image.isCover,
      sortOrder: image.sortOrder
    }))
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
}

function readCreateInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("invalid_product_payload");
  }

  const payload = input as Record<string, unknown>;
  const allowedKeys = new Set(["name", "description", "subcategoryId", "productType"]);

  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) {
    throw new Error("forbidden_product_field");
  }

  return {
    name: readName(payload.name),
    description: readDescription(payload.description),
    subcategoryId: readId(payload.subcategoryId, "invalid_subcategory"),
    productType: readProductType(payload.productType)
  };
}

function readUpdateInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("invalid_product_payload");
  }

  const payload = input as Record<string, unknown>;
  const allowedKeys = new Set(["name", "description", "subcategoryId", "isActive", "isFeatured", "productType"]);

  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) {
    throw new Error("forbidden_product_field");
  }

  const patch: {
    name?: string;
    description?: string;
    subcategoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    productType?: ProductType;
  } = {};

  if ("name" in payload) {
    patch.name = readName(payload.name);
  }

  if ("description" in payload) {
    patch.description = readDescription(payload.description);
  }

  if ("subcategoryId" in payload) {
    patch.subcategoryId = readId(payload.subcategoryId, "invalid_subcategory");
  }

  if ("isActive" in payload) {
    patch.isActive = readBoolean(payload.isActive, "invalid_active_state");
  }

  if ("isFeatured" in payload) {
    patch.isFeatured = readBoolean(payload.isFeatured, "invalid_featured_state");
  }

  if ("productType" in payload) {
    patch.productType = readProductType(payload.productType);
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("empty_product_update");
  }

  return patch;
}

function readName(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("invalid_product_name");
  }

  const name = value.trim();

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    throw new Error("invalid_product_name");
  }

  return name;
}

function readDescription(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("invalid_product_description");
  }

  const description = value.trim();

  if (description.length < MIN_DESCRIPTION_LENGTH || description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("invalid_product_description");
  }

  return description;
}

function readId(value: unknown, error: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(error);
  }

  return value.trim();
}

function readProductType(value: unknown): ProductType {
  if (value === undefined || value === null) {
    return "REGULAR";
  }

  if (typeof value !== "string" || !productTypes.has(value as ProductType)) {
    throw new Error("invalid_product_type");
  }

  return value as ProductType;
}

function readBoolean(value: unknown, error: string) {
  if (typeof value !== "boolean") {
    throw new Error(error);
  }

  return value;
}

function readPage(value: AdminProductListFilters["page"]) {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function readPageSize(value: AdminProductListFilters["pageSize"]) {
  const pageSize = Number(value ?? DEFAULT_PAGE_SIZE);

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(pageSize, MAX_PAGE_SIZE);
}
