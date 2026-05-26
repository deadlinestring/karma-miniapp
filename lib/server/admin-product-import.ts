import "server-only";

import { prisma } from "@/lib/server/prisma";
import { createSlug } from "@/lib/server/admin-categories";
import type { ProductType } from "@prisma/client";

type PrismaLike = typeof prisma;

export type ProductImportAction = "CREATE" | "UPDATE" | "ERROR";

export type ProductImportPreviewRow = {
  rowNumber: number;
  externalId: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string | null;
  subcategorySlug: string;
  subcategoryName: string | null;
  productType: ProductType;
  action: ProductImportAction;
  errors: string[];
  warnings: string[];
};

export type ProductImportPreview = {
  totalRows: number;
  createCount: number;
  updateCount: number;
  errorCount: number;
  rows: ProductImportPreviewRow[];
};

export type ProductImportServices = {
  db: PrismaLike;
};

const defaultServices: ProductImportServices = {
  db: prisma
};

export const PRODUCT_IMPORT_TEMPLATE_HEADER = "external_id;name;description;category_slug;subcategory_slug;product_type";
export const PRODUCT_IMPORT_TEMPLATE = `\uFEFF${PRODUCT_IMPORT_TEMPLATE_HEADER}\r\n`;

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_EXTERNAL_ID_LENGTH = 100;
const externalIdPattern = /^[a-z0-9_-]+$/;
const productTypes = new Set<ProductType>(["REGULAR", "CUSTOM"]);
const expectedHeaders = ["external_id", "name", "description", "category_slug", "subcategory_slug", "product_type"];

export async function previewProductImportFile(file: File) {
  return previewProductImportFileWithServices(file, defaultServices);
}

export async function previewProductImportFileWithServices(file: File, services: ProductImportServices): Promise<ProductImportPreview> {
  validateCsvFile(file);
  const text = stripBom(await file.text());
  return previewProductImportTextWithServices(text, services);
}

export async function previewProductImportTextWithServices(text: string, services: ProductImportServices): Promise<ProductImportPreview> {
  const records = parseCsv(text);

  if (records.length === 0) {
    throw new Error("empty_csv");
  }

  const [headers, ...rows] = records;
  assertHeaders(headers);

  if (rows.length === 0) {
    throw new Error("empty_csv");
  }

  if (rows.length > MAX_ROWS) {
    throw new Error("too_many_rows");
  }

  const [categories, existingProducts] = await Promise.all([
    services.db.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        subcategories: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    }),
    services.db.product.findMany({
      select: {
        id: true,
        externalId: true,
        slug: true
      }
    })
  ]);

  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const productsByExternalId = new Map(
    existingProducts
      .filter((product) => product.externalId)
      .map((product) => [product.externalId as string, product])
  );
  const productsBySlug = new Map(existingProducts.map((product) => [product.slug, product]));
  const seenExternalIds = new Set<string>();

  const previewRows = rows.map((row, index) =>
    validateImportRow({
      row,
      rowNumber: index + 2,
      categoriesBySlug,
      productsByExternalId,
      productsBySlug,
      seenExternalIds
    })
  );

  return {
    totalRows: previewRows.length,
    createCount: previewRows.filter((row) => row.action === "CREATE").length,
    updateCount: previewRows.filter((row) => row.action === "UPDATE").length,
    errorCount: previewRows.filter((row) => row.action === "ERROR").length,
    rows: previewRows
  };
}

function validateCsvFile(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const allowedType = !type || type.includes("csv") || type.startsWith("text/");

  if (!name.endsWith(".csv") && !allowedType) {
    throw new Error("invalid_csv_file");
  }

  if (file.size <= 0) {
    throw new Error("empty_csv");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("csv_too_large");
  }
}

function validateImportRow({
  row,
  rowNumber,
  categoriesBySlug,
  productsByExternalId,
  productsBySlug,
  seenExternalIds
}: {
  row: string[];
  rowNumber: number;
  categoriesBySlug: Map<string, { name: string; slug: string; isActive: boolean; subcategories: Array<{ name: string; slug: string; isActive: boolean }> }>;
  productsByExternalId: Map<string, { id: string; externalId: string | null; slug: string }>;
  productsBySlug: Map<string, { id: string; externalId: string | null; slug: string }>;
  seenExternalIds: Set<string>;
}): ProductImportPreviewRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const externalId = readCell(row, 0);
  const name = readCell(row, 1);
  const description = readCell(row, 2);
  const categorySlug = readCell(row, 3);
  const subcategorySlug = readCell(row, 4);
  const productTypeRaw = readCell(row, 5);
  let productType: ProductType = "REGULAR";

  if (!externalId) {
    errors.push("external_id обязателен");
  } else if (externalId.length < 3 || externalId.length > MAX_EXTERNAL_ID_LENGTH || !externalIdPattern.test(externalId)) {
    errors.push("external_id должен содержать lowercase latin, цифры, _ или - и иметь длину 3-100 символов");
  } else if (seenExternalIds.has(externalId)) {
    errors.push("external_id дублируется внутри файла");
  }

  if (externalId) {
    seenExternalIds.add(externalId);
  }

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    errors.push("name обязателен и должен быть длиной 2-120 символов");
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push("description не должен быть длиннее 2000 символов");
  }

  if (productTypeRaw) {
    if (productTypes.has(productTypeRaw as ProductType)) {
      productType = productTypeRaw as ProductType;
    } else {
      errors.push("product_type должен быть REGULAR или CUSTOM");
    }
  }

  const category = categorySlug ? categoriesBySlug.get(categorySlug) : null;

  if (!categorySlug) {
    errors.push("category_slug обязателен");
  } else if (!category) {
    errors.push("category_slug не найден");
  } else if (!category.isActive) {
    errors.push("category_slug скрыт");
  }

  const subcategory = category?.subcategories.find((item) => item.slug === subcategorySlug) ?? null;

  if (!subcategorySlug) {
    errors.push("subcategory_slug обязателен");
  } else if (!subcategory) {
    errors.push("subcategory_slug не найден внутри указанной категории");
  } else if (!subcategory.isActive) {
    errors.push("subcategory_slug скрыт");
  }

  const existingByExternalId = externalId ? productsByExternalId.get(externalId) : null;
  const candidateSlug = name ? createSlug(name) : "";
  const existingBySlug = candidateSlug ? productsBySlug.get(candidateSlug) : null;

  if (!existingByExternalId && existingBySlug) {
    errors.push("slug нового товара уже занят существующей ручной карточкой");
  }

  const action = errors.length > 0 ? "ERROR" : existingByExternalId ? "UPDATE" : "CREATE";

  if (action === "CREATE") {
    warnings.push("При будущем импорте товар будет создан скрытым, без фото и с PriceList main");
  }

  if (action === "UPDATE") {
    warnings.push("При будущем импорте публикация и фотографии существующего товара не будут меняться автоматически");
  }

  return {
    rowNumber,
    externalId,
    name,
    description,
    categorySlug,
    categoryName: category?.name ?? null,
    subcategorySlug,
    subcategoryName: subcategory?.name ?? null,
    productType,
    action,
    errors,
    warnings
  };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let isQuoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (isQuoted && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (char === ";" && !isQuoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      pushRow(rows, row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (isQuoted) {
    throw new Error("invalid_csv_quotes");
  }

  row.push(cell.trim());
  pushRow(rows, row);
  return rows;
}

function pushRow(rows: string[][], row: string[]) {
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }
}

function assertHeaders(headers: string[]) {
  const normalized = headers.map((header, index) => (index === 0 ? stripBom(header) : header).trim());

  if (normalized.length < expectedHeaders.length || expectedHeaders.some((header, index) => normalized[index] !== header)) {
    throw new Error("invalid_csv_header");
  }
}

function readCell(row: string[], index: number) {
  return (row[index] ?? "").trim();
}

function stripBom(text: string) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
