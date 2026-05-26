import { describe, expect, it, vi } from "vitest";
import {
  createAdminCategoryWithServices,
  createAdminSubcategoryWithServices,
  createSlug,
  LinkedProductsError,
  updateAdminCategoryWithServices,
  updateAdminSubcategoryWithServices,
  type AdminCategoryServices
} from "./admin-categories";

const category = {
  id: "category-1",
  name: "Аниме",
  slug: "anime",
  isActive: true,
  subcategories: [
    {
      id: "subcategory-1",
      categoryId: "category-1",
      name: "Наруто",
      slug: "naruto",
      isActive: true,
      _count: { products: 2 }
    }
  ],
  _count: { subcategories: 1 }
};

function makeServices(overrides: Record<string, unknown> = {}) {
  const db = {
    category: {
      findMany: vi.fn().mockResolvedValue([category]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({})
    },
    subcategory: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue({
        id: "subcategory-1",
        isActive: true,
        _count: { products: 2 }
      }),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({})
    },
    product: {
      groupBy: vi.fn().mockResolvedValue([
        { subcategoryId: "subcategory-1", isActive: true, _count: { _all: 2 } },
        { subcategoryId: "subcategory-1", isActive: false, _count: { _all: 1 } }
      ])
    },
    ...overrides
  } as unknown as AdminCategoryServices["db"];

  return { services: { db } satisfies AdminCategoryServices, db };
}

describe("admin categories repository", () => {
  it("generates stable slugs from Russian names", () => {
    expect(createSlug("  Атака титанов!  ")).toBe("ataka-titanov");
    expect(createSlug("BMW / M-серия")).toBe("bmw-m-seriya");
  });

  it("creates a category with a server-generated slug", async () => {
    const { services, db } = makeServices();

    await createAdminCategoryWithServices({ name: "Атака титанов" }, services);

    expect(db.category.create).toHaveBeenCalledWith({
      data: {
        name: "Атака титанов",
        slug: "ataka-titanov",
        isActive: true
      }
    });
  });

  it("rejects duplicate category slugs", async () => {
    const { services, db } = makeServices();
    vi.mocked(db.category.findUnique).mockResolvedValueOnce({ id: "existing" } as never);

    await expect(createAdminCategoryWithServices({ name: "Аниме" }, services)).rejects.toThrow("category_slug_exists");
  });

  it("renames a category without changing its slug", async () => {
    const { services, db } = makeServices();
    vi.mocked(db.category.findUnique).mockResolvedValueOnce({
      id: "category-1",
      isActive: true,
      subcategories: []
    } as never);

    await updateAdminCategoryWithServices("category-1", { name: "Новое имя" }, services);

    expect(db.category.update).toHaveBeenCalledWith({
      where: { id: "category-1" },
      data: { name: "Новое имя" }
    });
  });

  it("requires confirmation before hiding a category with active products", async () => {
    const { services, db } = makeServices();
    vi.mocked(db.category.findUnique).mockResolvedValueOnce({
      id: "category-1",
      isActive: true,
      subcategories: [{ id: "subcategory-1", _count: { products: 2 } }]
    } as never);

    await expect(updateAdminCategoryWithServices("category-1", { isActive: false }, services)).rejects.toBeInstanceOf(
      LinkedProductsError
    );
  });

  it("hides a category when linked product confirmation is present", async () => {
    const { services, db } = makeServices();
    vi.mocked(db.category.findUnique).mockResolvedValueOnce({
      id: "category-1",
      isActive: true,
      subcategories: [{ id: "subcategory-1", _count: { products: 2 } }]
    } as never);

    await updateAdminCategoryWithServices(
      "category-1",
      { isActive: false, confirmHideLinkedProducts: true },
      services
    );

    expect(db.category.update).toHaveBeenCalledWith({
      where: { id: "category-1" },
      data: { isActive: false }
    });
  });

  it("allows the same subcategory slug in different categories but rejects duplicates inside one category", async () => {
    const { services, db } = makeServices();
    vi.mocked(db.category.findUnique).mockResolvedValueOnce({ id: "category-2" } as never);

    await createAdminSubcategoryWithServices("category-2", { name: "Наруто" }, services);

    expect(db.subcategory.findUnique).toHaveBeenCalledWith({
      where: { categoryId_slug: { categoryId: "category-2", slug: "naruto" } },
      select: { id: true }
    });

    vi.mocked(db.category.findUnique).mockResolvedValueOnce({ id: "category-2" } as never);
    vi.mocked(db.subcategory.findUnique).mockResolvedValueOnce({ id: "existing" } as never);

    await expect(createAdminSubcategoryWithServices("category-2", { name: "Наруто" }, services)).rejects.toThrow(
      "subcategory_slug_exists"
    );
  });

  it("requires confirmation before hiding a subcategory with active products", async () => {
    const { services } = makeServices();

    await expect(
      updateAdminSubcategoryWithServices("category-1", "subcategory-1", { isActive: false }, services)
    ).rejects.toBeInstanceOf(LinkedProductsError);
  });

  it("has no physical delete flow", () => {
    expect(Object.keys({ createAdminCategoryWithServices, updateAdminCategoryWithServices })).not.toContain(
      "deleteAdminCategory"
    );
  });
});
