import { prisma } from "@/lib/server/prisma";

export async function getActiveCategoriesWithSubcategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subcategories: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
      }
    }
  });
}

export async function getActiveProductsForCatalog() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      subcategory: {
        include: {
          category: true
        }
      },
      images: {
        orderBy: [{ sortOrder: "asc" }]
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ itemType: "asc" }, { sizeCm: "asc" }]
      }
    }
  });
}

export async function getActiveProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      isActive: true
    },
    include: {
      subcategory: {
        include: {
          category: true
        }
      },
      images: {
        orderBy: [{ sortOrder: "asc" }]
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ itemType: "asc" }, { sizeCm: "asc" }]
      }
    }
  });
}

export async function getStoreSettings() {
  return prisma.storeSettings.findFirst({
    orderBy: { createdAt: "asc" }
  });
}
