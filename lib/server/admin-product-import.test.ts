import { describe, expect, it, vi } from "vitest";
import { PRODUCT_IMPORT_TEMPLATE, PRODUCT_IMPORT_TEMPLATE_HEADER, previewProductImportFileWithServices, previewProductImportTextWithServices } from "./admin-product-import";
import type { ProductImportServices } from "./admin-product-import";

function makeServices({
  products = [],
  categoryActive = true,
  subcategoryActive = true
}: {
  products?: Array<{ id: string; externalId: string | null; slug: string }>;
  categoryActive?: boolean;
  subcategoryActive?: boolean;
} = {}) {
  const writes = {
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    transaction: vi.fn()
  };
  const services = {
    db: {
      category: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "category-1",
            name: "Аниме",
            slug: "anime",
            isActive: categoryActive,
            subcategories: [
              {
                id: "subcategory-1",
                name: "One Piece",
                slug: "one-piece",
                isActive: subcategoryActive
              }
            ]
          }
        ]),
        create: writes.create,
        update: writes.update,
        upsert: writes.upsert,
        delete: writes.delete,
        updateMany: writes.updateMany,
        deleteMany: writes.deleteMany
      },
      product: {
        findMany: vi.fn().mockResolvedValue(products),
        create: writes.create,
        update: writes.update,
        upsert: writes.upsert,
        delete: writes.delete,
        updateMany: writes.updateMany,
        deleteMany: writes.deleteMany
      },
      subcategory: {
        create: writes.create,
        update: writes.update,
        upsert: writes.upsert,
        delete: writes.delete,
        updateMany: writes.updateMany,
        deleteMany: writes.deleteMany
      },
      $transaction: writes.transaction
    }
  } as unknown as ProductImportServices;

  return { services, writes };
}

function csv(row: string) {
  return `${PRODUCT_IMPORT_TEMPLATE_HEADER}\n${row}`;
}

describe("admin product CSV import preview", () => {
  it("keeps the template as BOM-prefixed CSV with only a header row", () => {
    expect(PRODUCT_IMPORT_TEMPLATE.charCodeAt(0)).toBe(0xfeff);
    expect(PRODUCT_IMPORT_TEMPLATE).toContain(PRODUCT_IMPORT_TEMPLATE_HEADER);
    expect(PRODUCT_IMPORT_TEMPLATE.trim().split(/\r?\n/)).toHaveLength(1);
  });

  it("marks a valid new row as CREATE", async () => {
    const { services } = makeServices();

    const preview = await previewProductImportTextWithServices(
      csv("anime_onepiece_luffy_002;Монки Д. Луффи;Описание;anime;one-piece;REGULAR"),
      services
    );

    expect(preview.createCount).toBe(1);
    expect(preview.rows[0]).toEqual(expect.objectContaining({ action: "CREATE", productType: "REGULAR", errors: [] }));
  });

  it("marks an existing externalId as UPDATE", async () => {
    const { services } = makeServices({ products: [{ id: "product-1", externalId: "anime_onepiece_luffy_002", slug: "old-slug" }] });

    const preview = await previewProductImportTextWithServices(
      csv("anime_onepiece_luffy_002;Монки Д. Луффи;Описание;anime;one-piece;"),
      services
    );

    expect(preview.updateCount).toBe(1);
    expect(preview.rows[0]).toEqual(expect.objectContaining({ action: "UPDATE", productType: "REGULAR" }));
  });

  it("rejects duplicate external_id inside the file", async () => {
    const { services } = makeServices();
    const preview = await previewProductImportTextWithServices(
      `${PRODUCT_IMPORT_TEMPLATE_HEADER}\nitem_001;Товар 1;;anime;one-piece;REGULAR\nitem_001;Товар 2;;anime;one-piece;REGULAR`,
      services
    );

    expect(preview.errorCount).toBe(1);
    expect(preview.rows[1].errors.join(" ")).toContain("дублируется");
  });

  it("rejects missing and malformed external_id", async () => {
    const { services } = makeServices();
    const preview = await previewProductImportTextWithServices(
      `${PRODUCT_IMPORT_TEMPLATE_HEADER}\n;Товар 1;;anime;one-piece;REGULAR\nBad Id;Товар 2;;anime;one-piece;REGULAR`,
      services
    );

    expect(preview.errorCount).toBe(2);
  });

  it("rejects unknown category and foreign subcategory", async () => {
    const { services } = makeServices();
    const preview = await previewProductImportTextWithServices(
      `${PRODUCT_IMPORT_TEMPLATE_HEADER}\nitem_001;Товар 1;;games;one-piece;REGULAR\nitem_002;Товар 2;;anime;naruto;REGULAR`,
      services
    );

    expect(preview.errorCount).toBe(2);
    expect(preview.rows[0].errors.join(" ")).toContain("category_slug не найден");
    expect(preview.rows[1].errors.join(" ")).toContain("subcategory_slug не найден");
  });

  it("rejects inactive category or subcategory", async () => {
    const inactiveCategory = await previewProductImportTextWithServices(
      csv("item_001;Товар 1;;anime;one-piece;REGULAR"),
      makeServices({ categoryActive: false }).services
    );
    const inactiveSubcategory = await previewProductImportTextWithServices(
      csv("item_002;Товар 2;;anime;one-piece;REGULAR"),
      makeServices({ subcategoryActive: false }).services
    );

    expect(inactiveCategory.rows[0].errors.join(" ")).toContain("category_slug скрыт");
    expect(inactiveSubcategory.rows[0].errors.join(" ")).toContain("subcategory_slug скрыт");
  });

  it("rejects invalid product_type and defaults an empty product_type to REGULAR", async () => {
    const { services } = makeServices();
    const preview = await previewProductImportTextWithServices(
      `${PRODUCT_IMPORT_TEMPLATE_HEADER}\nitem_001;Товар 1;;anime;one-piece;BAD\nitem_002;Товар 2;;anime;one-piece;`,
      services
    );

    expect(preview.rows[0].action).toBe("ERROR");
    expect(preview.rows[1]).toEqual(expect.objectContaining({ action: "CREATE", productType: "REGULAR" }));
  });

  it("rejects a new row when generated slug conflicts with a manual product", async () => {
    const { services } = makeServices({ products: [{ id: "manual-product", externalId: null, slug: "monki-d-luffi" }] });
    const preview = await previewProductImportTextWithServices(
      csv("item_001;Монки Д. Луффи;;anime;one-piece;REGULAR"),
      services
    );

    expect(preview.rows[0].action).toBe("ERROR");
    expect(preview.rows[0].errors.join(" ")).toContain("slug нового товара уже занят");
  });

  it("parses quoted descriptions with semicolon and UTF-8 BOM", async () => {
    const { services } = makeServices();
    const preview = await previewProductImportTextWithServices(
      `\uFEFF${PRODUCT_IMPORT_TEMPLATE_HEADER}\nitem_001;Товар;\"Описание; с разделителем\";anime;one-piece;REGULAR`,
      services
    );

    expect(preview.rows[0]).toEqual(expect.objectContaining({ description: "Описание; с разделителем", action: "CREATE" }));
  });

  it("rejects files larger than 2 MB and more than 1000 rows", async () => {
    const { services } = makeServices();
    const largeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "products.csv", { type: "text/csv" });
    const rows = Array.from({ length: 1001 }, (_, index) => `item_${index};Товар ${index};;anime;one-piece;REGULAR`).join("\n");

    await expect(previewProductImportFileWithServices(largeFile, services)).rejects.toThrow("csv_too_large");
    await expect(previewProductImportTextWithServices(`${PRODUCT_IMPORT_TEMPLATE_HEADER}\n${rows}`, services)).rejects.toThrow("too_many_rows");
  });

  it("does not call Prisma write methods while previewing", async () => {
    const { services, writes } = makeServices();

    await previewProductImportTextWithServices(csv("item_001;Товар 1;;anime;one-piece;REGULAR"), services);

    expect(writes.create).not.toHaveBeenCalled();
    expect(writes.update).not.toHaveBeenCalled();
    expect(writes.upsert).not.toHaveBeenCalled();
    expect(writes.delete).not.toHaveBeenCalled();
    expect(writes.updateMany).not.toHaveBeenCalled();
    expect(writes.deleteMany).not.toHaveBeenCalled();
    expect(writes.transaction).not.toHaveBeenCalled();
  });
});
