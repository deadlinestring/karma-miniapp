import { describe, expect, it, vi } from "vitest";
import {
  addAdminProductGalleryImageWithServices,
  createAdminProductWithServices,
  deleteAdminProductImageWithServices,
  getAdminProductsWithServices,
  setAdminProductCoverImageWithServices,
  updateAdminProductWithServices,
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

function makeFullProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    name: "Наруто Узумаки",
    slug: "naruto-uzumaki",
    description: "Тестовый товар",
    productType: "REGULAR",
    isActive: true,
    isFeatured: false,
    subcategoryId: "subcategory-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    subcategory: {
      id: "subcategory-1",
      name: "Наруто",
      slug: "naruto",
      isActive: true,
      category: {
        id: "category-1",
        name: "Аниме",
        slug: "anime",
        isActive: true
      }
    },
    priceList: {
      id: "main",
      name: "Основной прайс KARMA",
      slug: "main",
      isActive: true,
      items: [{ id: "pli-1" }]
    },
    images: [{ id: "image-cover", url: "/cover.svg", altText: null, isCover: true, sortOrder: 10 }],
    ...overrides
  };
}

function makeSubcategory(overrides: Record<string, unknown> = {}) {
  return {
    id: "subcategory-1",
    isActive: true,
    category: {
      id: "category-1",
      name: "Аниме",
      slug: "anime",
      isActive: true
    },
    ...overrides
  };
}

function makeServices({
  productImage,
  fullProduct = makeFullProduct(),
  subcategory = makeSubcategory(),
  priceList = { id: "main", isActive: true, items: [{ id: "pli-1" }] },
  slugExists = false,
  createRejects = false
}: {
  productImage?: {
    id: string;
    productId: string;
    storagePath: string | null;
    isCover: boolean;
  } | null;
  fullProduct?: ReturnType<typeof makeFullProduct>;
  subcategory?: ReturnType<typeof makeSubcategory> | null;
  priceList?: { id: string; isActive: boolean; items: Array<{ id: string }> } | null;
  slugExists?: boolean;
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
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([fullProduct]),
      findUnique: vi.fn().mockImplementation((args) => {
        if (args.where?.slug) {
          return Promise.resolve(slugExists ? { id: "existing-product" } : null);
        }

        if (args.select?.subcategory) {
          return Promise.resolve(fullProduct);
        }

        return Promise.resolve({ id: fullProduct.id, name: fullProduct.name });
      }),
      create: vi.fn().mockResolvedValue({ id: fullProduct.id }),
      update: vi.fn().mockResolvedValue({})
    },
    subcategory: {
      findUnique: vi.fn().mockResolvedValue(subcategory)
    },
    priceList: {
      findUnique: vi.fn().mockResolvedValue(priceList)
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

describe("admin products repository", () => {
  it("creates a hidden product with the main price list", async () => {
    const { services } = makeServices();

    await createAdminProductWithServices(
      {
        name: "Саске Учиха",
        description: "Новый ночник",
        subcategoryId: "subcategory-1"
      },
      services
    );

    expect(services.db.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Саске Учиха",
        slug: "saske-uchiha",
        subcategoryId: "subcategory-1",
        priceListId: "main",
        productType: "REGULAR",
        isActive: false,
        isFeatured: false
      }),
      select: { id: true }
    });
  });

  it("rejects a product slug conflict", async () => {
    const { services } = makeServices({ slugExists: true });

    await expect(
      createAdminProductWithServices({ name: "Наруто Узумаки", description: "Описание", subcategoryId: "subcategory-1" }, services)
    ).rejects.toThrow("product_slug_exists");
  });

  it("does not allow direct price list changes", async () => {
    const { services } = makeServices();

    await expect(updateAdminProductWithServices("product-1", { priceListId: "other" }, services)).rejects.toThrow("forbidden_product_field");
  });

  it("renames a product without changing slug", async () => {
    const { services } = makeServices();

    await updateAdminProductWithServices("product-1", { name: "Наруто новый" }, services);

    expect(services.db.product.update).toHaveBeenCalledWith({
      where: { id: "product-1" },
      data: expect.objectContaining({ name: "Наруто новый" })
    });
    expect(services.db.product.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: expect.anything() }) }));
  });

  it("moves a product by changing only the subcategory relation", async () => {
    const { services } = makeServices({ subcategory: makeSubcategory({ id: "subcategory-2" }) });

    await updateAdminProductWithServices("product-1", { subcategoryId: "subcategory-2" }, services);

    expect(services.db.product.update).toHaveBeenCalledWith({
      where: { id: "product-1" },
      data: { subcategoryId: "subcategory-2" }
    });
  });

  it("rejects publishing without exactly one cover image", async () => {
    const { services } = makeServices({ fullProduct: makeFullProduct({ isActive: false, images: [] }) });

    await expect(updateAdminProductWithServices("product-1", { isActive: true }, services)).rejects.toThrow("cover_required");
  });

  it("rejects publishing with an inactive category", async () => {
    const { services } = makeServices({
      fullProduct: makeFullProduct({ isActive: false }),
      subcategory: makeSubcategory({ category: { id: "category-1", name: "Аниме", slug: "anime", isActive: false } })
    });

    await expect(updateAdminProductWithServices("product-1", { isActive: true, subcategoryId: "subcategory-1" }, services)).rejects.toThrow(
      "category_inactive"
    );
  });

  it("rejects publishing with an inactive subcategory", async () => {
    const { services } = makeServices({ fullProduct: makeFullProduct({ isActive: false }), subcategory: makeSubcategory({ isActive: false }) });

    await expect(updateAdminProductWithServices("product-1", { isActive: true, subcategoryId: "subcategory-1" }, services)).rejects.toThrow(
      "subcategory_inactive"
    );
  });

  it("rejects publishing without an active price list", async () => {
    const { services } = makeServices({
      fullProduct: makeFullProduct({ isActive: false, priceList: { id: "main", name: "Основной прайс KARMA", slug: "main", isActive: false, items: [] } })
    });

    await expect(updateAdminProductWithServices("product-1", { isActive: true }, services)).rejects.toThrow("price_list_not_ready");
  });

  it("rejects featured status for a hidden product", async () => {
    const { services } = makeServices({ fullProduct: makeFullProduct({ isActive: false }) });

    await expect(updateAdminProductWithServices("product-1", { isFeatured: true }, services)).rejects.toThrow("featured_requires_active_product");
  });

  it("clears featured status when hiding a product", async () => {
    const { services } = makeServices({ fullProduct: makeFullProduct({ isActive: true, isFeatured: true }) });

    await updateAdminProductWithServices("product-1", { isActive: false }, services);

    expect(services.db.product.update).toHaveBeenCalledWith({
      where: { id: "product-1" },
      data: { isActive: false, isFeatured: false }
    });
  });

  it("builds admin list filters and clamps page size", async () => {
    const { services } = makeServices();

    const result = await getAdminProductsWithServices(
      {
        search: " наруто ",
        categoryId: "category-1",
        status: "featured",
        page: "2",
        pageSize: "500"
      },
      services
    );

    expect(result.pageSize).toBe(50);
    expect(services.db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: "наруто", mode: "insensitive" },
          subcategory: { categoryId: "category-1" },
          isFeatured: true
        },
        skip: 50,
        take: 50
      })
    );
  });

  it("does not expose a physical delete flow", async () => {
    const adminProductsModule = await import("./admin-products");

    expect("deleteAdminProductWithServices" in adminProductsModule).toBe(false);
  });
});

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
