import "server-only";

import { prisma } from "@/lib/server/prisma";
import { deletePublicProductImage, isManagedProductImagePath, uploadPublicProductImage } from "@/lib/server/supabase-storage";
import type { ValidatedAdminImageFile } from "@/lib/server/upload-validation";

type PrismaLike = typeof prisma;

export type AdminProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  sortOrder: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  coverImage: AdminProductImage | null;
  images: AdminProductImage[];
};

export type DeleteProductImageResult = {
  product: AdminProduct;
  storageCleanupAttempted: boolean;
  storageCleanupFailed: boolean;
};

type ProductRecord = Awaited<ReturnType<typeof readAdminProducts>>[number];

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

export async function getAdminProducts() {
  const products = await readAdminProducts(defaultServices.db);
  return products.map(mapAdminProduct);
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

  return getAdminProductById(product.id, services.db);
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

  return getAdminProductById(product.id, services.db);
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

  return getAdminProductById(productId, services.db);
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
    product: await getAdminProductById(productId, services.db),
    storageCleanupAttempted,
    storageCleanupFailed
  };
}

async function readAdminProducts(db: PrismaLike) {
  return db.product.findMany({
    where: {
      isActive: true,
      subcategory: {
        isActive: true,
        category: { isActive: true }
      }
    },
    orderBy: [{ createdAt: "asc" }],
    select: adminProductSelect()
  });
}

async function getAdminProductById(productId: string, db: PrismaLike): Promise<AdminProduct> {
  const product = await db.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      subcategory: {
        isActive: true,
        category: { isActive: true }
      }
    },
    select: adminProductSelect()
  });

  if (!product) {
    throw new Error("product_not_found");
  }

  return mapAdminProduct(product);
}

async function ensureProductExists(productId: string, db: PrismaLike) {
  const product = await db.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true, name: true }
  });

  if (!product) {
    throw new Error("product_not_found");
  }

  return product;
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

function adminProductSelect() {
  return {
    id: true,
    name: true,
    slug: true,
    createdAt: true,
    subcategory: {
      include: {
        category: true
      }
    },
    images: {
      orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }]
    }
  };
}

function mapAdminProduct(product: ProductRecord): AdminProduct {
  const images = product.images.map((image) => ({
    id: image.id,
    url: image.url,
    altText: image.altText,
    isCover: image.isCover,
    sortOrder: image.sortOrder
  }));
  const coverImage = images.find((image) => image.isCover) ?? images[0] ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.subcategory.category.name,
    subcategory: product.subcategory.name,
    coverImage,
    images: [...images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder)
  };
}
