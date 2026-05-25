import { describe, expect, it, vi } from "vitest";
import {
  addAdminProductGalleryImageWithServices,
  deleteAdminProductImageWithServices,
  setAdminProductCoverImageWithServices,
  uploadAdminProductCoverImageWithServices,
  type AdminProductServices
} from "./admin-products";
import type { ValidatedAdminImageFile } from "./upload-validation";

const image: ValidatedAdminImageFile = {
  buffer: Buffer.from([1, 2, 3]),
  contentType: "image/png",
  extension: "png",
  size: 3
};

function makeFullProduct(images = [{ id: "image-cover", url: "/cover.svg", altText: null, isCover: true, sortOrder: 10 }]) {
  return {
    id: "product-1",
    name: "Наруто Узумаки",
    slug: "naruto-uzumaki",
    subcategory: {
      name: "Наруто",
      category: { name: "Аниме" }
    },
    images
  };
}

function makeServices({
  productImage,
  fullProduct = makeFullProduct(),
  createRejects = false
}: {
  productImage?: {
    id: string;
    productId: string;
    storagePath: string | null;
    isCover: boolean;
  } | null;
  fullProduct?: ReturnType<typeof makeFullProduct>;
  createRejects?: boolean;
} = {}) {
  const productImageResult =
    productImage === undefined
      ? {
          id: "image-gallery",
          productId: "product-1",
          storagePath: "products/product-1/gallery.png",
          isCover: false
        }
      : productImage;
  const operations: string[] = [];
  const deleteImage = vi.fn().mockResolvedValue(undefined);
  const uploadImage = vi.fn().mockResolvedValue({
    publicUrl: "https://example.test/new-product-image.png",
    storagePath: "products/product-1/new-product-image.png"
  });
  const tx = {
    productImage: {
      updateMany: vi.fn().mockImplementation((args) => {
        operations.push(`updateMany:${String(args.data.isCover)}`);
        return Promise.resolve({});
      }),
      create: vi.fn().mockImplementation((args) => {
        operations.push(`create:${String(args.data.isCover)}`);
        return Promise.resolve(args.data);
      }),
      update: vi.fn().mockImplementation((args) => {
        operations.push(`update:${String(args.data.isCover)}`);
        return Promise.resolve(args.data);
      })
    }
  };
  const db = {
    product: {
      findFirst: vi.fn().mockImplementation((args) => Promise.resolve(args.select ? { id: "product-1", name: "Наруто Узумаки" } : fullProduct)),
      findMany: vi.fn()
    },
    productImage: {
      aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 20 } }),
      create: vi.fn().mockImplementation((args) => (createRejects ? Promise.reject(new Error("db_failed")) : Promise.resolve(args.data))),
      findFirst: vi.fn().mockResolvedValue(productImageResult),
      delete: vi.fn().mockResolvedValue({})
    },
    $transaction: vi.fn().mockImplementation((callback) => callback(tx))
  } as unknown as AdminProductServices["db"];

  return {
    operations,
    tx,
    services: {
      db,
      uploadImage,
      deleteImage
    } satisfies AdminProductServices
  };
}

describe("admin product images repository", () => {
  it("creates gallery upload as non-cover image", async () => {
    const { services } = makeServices();

    await addAdminProductGalleryImageWithServices("product-1", image, services);

    expect(services.db.productImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: "product-1",
        isCover: false,
        sortOrder: 30,
        storagePath: "products/product-1/new-product-image.png"
      })
    });
  });

  it("uploads a cover by clearing previous cover before creating the new cover in a transaction", async () => {
    const { operations, services } = makeServices();

    await uploadAdminProductCoverImageWithServices("product-1", image, services);

    expect(operations).toEqual(["updateMany:false", "create:true"]);
  });

  it("rolls back only the newly uploaded file when Prisma create fails after Storage upload", async () => {
    const { services } = makeServices({ createRejects: true });

    await expect(addAdminProductGalleryImageWithServices("product-1", image, services)).rejects.toThrow("db_failed");

    expect(services.deleteImage).toHaveBeenCalledWith("product-1", "products/product-1/new-product-image.png");
  });

  it("uses a transaction when assigning an existing image as cover", async () => {
    const { operations, services } = makeServices();

    await setAdminProductCoverImageWithServices("product-1", "image-gallery", services);

    expect(operations).toEqual(["updateMany:false", "update:true"]);
  });

  it("forbids deleting the current cover image", async () => {
    const { services } = makeServices({
      productImage: {
        id: "image-cover",
        productId: "product-1",
        storagePath: "products/product-1/cover.png",
        isCover: true
      }
    });

    await expect(deleteAdminProductImageWithServices("product-1", "image-cover", services)).rejects.toThrow("cannot_delete_cover_image");

    expect(services.db.productImage.delete).not.toHaveBeenCalled();
  });

  it("deletes a non-cover image from the database", async () => {
    const { services } = makeServices();

    await deleteAdminProductImageWithServices("product-1", "image-gallery", services);

    expect(services.db.productImage.delete).toHaveBeenCalledWith({ where: { id: "image-gallery" } });
  });

  it("does not delete mock image paths from Supabase Storage", async () => {
    const { services } = makeServices({
      productImage: {
        id: "image-mock",
        productId: "product-1",
        storagePath: "/images/mock/product-cyan.svg",
        isCover: false
      }
    });

    const result = await deleteAdminProductImageWithServices("product-1", "image-mock", services);

    expect(result.storageCleanupAttempted).toBe(false);
    expect(services.deleteImage).not.toHaveBeenCalled();
  });

  it("cleans up uploaded product image paths from Supabase Storage", async () => {
    const { services } = makeServices();

    const result = await deleteAdminProductImageWithServices("product-1", "image-gallery", services);

    expect(result.storageCleanupAttempted).toBe(true);
    expect(services.deleteImage).toHaveBeenCalledWith("product-1", "products/product-1/gallery.png");
  });

  it("rejects deleting an image that belongs to another product", async () => {
    const { services } = makeServices({ productImage: null });

    await expect(deleteAdminProductImageWithServices("product-1", "other-image", services)).rejects.toThrow("image_not_found");
  });
});
