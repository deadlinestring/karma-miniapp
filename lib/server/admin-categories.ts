import "server-only";

import { prisma } from "@/lib/server/prisma";

type PrismaLike = typeof prisma;

export type AdminSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  activeProductCount: number;
  totalProductCount: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  activeProductCount: number;
  totalProductCount: number;
  subcategories: AdminSubcategory[];
};

export type AdminCategoryTree = {
  categories: AdminCategory[];
};

export type AdminCategoryServices = {
  db: PrismaLike;
};

export type CategoryMutationResult = {
  categoryTree: AdminCategoryTree;
};

const defaultServices: AdminCategoryServices = {
  db: prisma
};

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;

const transliterationMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

export async function getAdminCategoryTree() {
  return getAdminCategoryTreeWithServices(defaultServices);
}

export async function createAdminCategory(input: unknown) {
  return createAdminCategoryWithServices(input, defaultServices);
}

export async function updateAdminCategory(categoryId: string, input: unknown) {
  return updateAdminCategoryWithServices(categoryId, input, defaultServices);
}

export async function createAdminSubcategory(categoryId: string, input: unknown) {
  return createAdminSubcategoryWithServices(categoryId, input, defaultServices);
}

export async function updateAdminSubcategory(categoryId: string, subcategoryId: string, input: unknown) {
  return updateAdminSubcategoryWithServices(categoryId, subcategoryId, input, defaultServices);
}

export async function getAdminCategoryTreeWithServices(services: AdminCategoryServices): Promise<AdminCategoryTree> {
  const categories = await services.db.category.findMany({
    include: {
      subcategories: {
        include: {
          _count: { select: { products: true } }
        }
      },
      _count: { select: { subcategories: true } }
    }
  });

  const productCounts = await services.db.product.groupBy({
    by: ["subcategoryId", "isActive"],
    _count: { _all: true }
  });
  const countsBySubcategory = new Map<string, { active: number; total: number }>();

  for (const count of productCounts) {
    const current = countsBySubcategory.get(count.subcategoryId) ?? { active: 0, total: 0 };
    current.total += count._count._all;

    if (count.isActive) {
      current.active += count._count._all;
    }

    countsBySubcategory.set(count.subcategoryId, current);
  }

  return {
    categories: categories
      .map((category) => {
        const subcategories = category.subcategories
          .map((subcategory) => {
            const counts = countsBySubcategory.get(subcategory.id) ?? { active: 0, total: 0 };

            return {
              id: subcategory.id,
              categoryId: subcategory.categoryId,
              name: subcategory.name,
              slug: subcategory.slug,
              isActive: subcategory.isActive,
              activeProductCount: counts.active,
              totalProductCount: counts.total
            };
          })
          .sort(compareAdminItems);

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          isActive: category.isActive,
          activeProductCount: subcategories.reduce((sum, subcategory) => sum + subcategory.activeProductCount, 0),
          totalProductCount: subcategories.reduce((sum, subcategory) => sum + subcategory.totalProductCount, 0),
          subcategories
        };
      })
      .sort(compareAdminItems)
  };
}

export async function createAdminCategoryWithServices(input: unknown, services: AdminCategoryServices) {
  const name = readName(input);
  const slug = createSlug(name);
  const existing = await services.db.category.findUnique({ where: { slug }, select: { id: true } });

  if (existing) {
    throw new Error("category_slug_exists");
  }

  await services.db.category.create({
    data: {
      name,
      slug,
      isActive: true
    }
  });

  return { categoryTree: await getAdminCategoryTreeWithServices(services) };
}

export async function updateAdminCategoryWithServices(
  categoryId: string,
  input: unknown,
  services: AdminCategoryServices
): Promise<CategoryMutationResult> {
  const patch = readUpdateInput(input);
  const category = await services.db.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      isActive: true,
      subcategories: {
        select: {
          id: true,
          _count: { select: { products: { where: { isActive: true } } } }
        }
      }
    }
  });

  if (!category) {
    throw new Error("category_not_found");
  }

  const activeProductCount = category.subcategories.reduce((sum, subcategory) => sum + subcategory._count.products, 0);

  if (patch.isActive === false && category.isActive && activeProductCount > 0 && !patch.confirmHideLinkedProducts) {
    throw new LinkedProductsError("category_hide_requires_confirmation", activeProductCount);
  }

  await services.db.category.update({
    where: { id: category.id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {})
    }
  });

  return { categoryTree: await getAdminCategoryTreeWithServices(services) };
}

export async function createAdminSubcategoryWithServices(
  categoryId: string,
  input: unknown,
  services: AdminCategoryServices
): Promise<CategoryMutationResult> {
  const name = readName(input);
  const category = await services.db.category.findUnique({ where: { id: categoryId }, select: { id: true } });

  if (!category) {
    throw new Error("category_not_found");
  }

  const slug = createSlug(name);
  const existing = await services.db.subcategory.findUnique({
    where: { categoryId_slug: { categoryId: category.id, slug } },
    select: { id: true }
  });

  if (existing) {
    throw new Error("subcategory_slug_exists");
  }

  await services.db.subcategory.create({
    data: {
      categoryId: category.id,
      name,
      slug,
      isActive: true
    }
  });

  return { categoryTree: await getAdminCategoryTreeWithServices(services) };
}

export async function updateAdminSubcategoryWithServices(
  categoryId: string,
  subcategoryId: string,
  input: unknown,
  services: AdminCategoryServices
): Promise<CategoryMutationResult> {
  const patch = readUpdateInput(input);
  const subcategory = await services.db.subcategory.findFirst({
    where: { id: subcategoryId, categoryId },
    select: {
      id: true,
      isActive: true,
      _count: { select: { products: { where: { isActive: true } } } }
    }
  });

  if (!subcategory) {
    throw new Error("subcategory_not_found");
  }

  const activeProductCount = subcategory._count.products;

  if (patch.isActive === false && subcategory.isActive && activeProductCount > 0 && !patch.confirmHideLinkedProducts) {
    throw new LinkedProductsError("subcategory_hide_requires_confirmation", activeProductCount);
  }

  await services.db.subcategory.update({
    where: { id: subcategory.id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {})
    }
  });

  return { categoryTree: await getAdminCategoryTreeWithServices(services) };
}

export class LinkedProductsError extends Error {
  constructor(message: string, readonly activeProductCount: number) {
    super(message);
  }
}

export function createSlug(name: string) {
  const transliterated = name
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => transliterationMap[char] ?? char)
    .join("");
  const slug = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!slug) {
    throw new Error("invalid_slug");
  }

  return slug;
}

export function readName(input: unknown) {
  if (!input || typeof input !== "object" || !("name" in input)) {
    throw new Error("invalid_name");
  }

  const name = (input as { name: unknown }).name;

  if (typeof name !== "string") {
    throw new Error("invalid_name");
  }

  const trimmed = name.trim();

  if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
    throw new Error("invalid_name");
  }

  return trimmed;
}

function readUpdateInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("invalid_category_payload");
  }

  const payload = input as Record<string, unknown>;
  const allowedKeys = new Set(["name", "isActive", "confirmHideLinkedProducts"]);

  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) {
    throw new Error("forbidden_category_field");
  }

  const patch: {
    name?: string;
    isActive?: boolean;
    confirmHideLinkedProducts: boolean;
  } = {
    confirmHideLinkedProducts: payload.confirmHideLinkedProducts === true
  };

  if ("name" in payload) {
    patch.name = readName(payload);
  }

  if ("isActive" in payload) {
    if (typeof payload.isActive !== "boolean") {
      throw new Error("invalid_active_state");
    }

    patch.isActive = payload.isActive;
  }

  if (patch.name === undefined && patch.isActive === undefined) {
    throw new Error("empty_category_update");
  }

  return patch;
}

function compareAdminItems<T extends { isActive: boolean; name: string }>(left: T, right: T) {
  if (left.isActive !== right.isActive) {
    return left.isActive ? -1 : 1;
  }

  return left.name.localeCompare(right.name, "ru");
}
