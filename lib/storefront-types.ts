export type StorefrontItemType = "STANDARD" | "PREMIUM" | "WALL_PANEL";

export type StorefrontSettings = {
  storeName: string;
  subtitle: string | null;
  heroTitle: string;
  heroSubtitle: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    coverImageUrl: string | null;
  }>;
};

export type StorefrontImage = {
  id: string;
  url: string;
  storagePath: string | null;
  altText: string | null;
  isCover: boolean;
  sortOrder: number;
};

export type StorefrontVariant = {
  id: string;
  itemType: StorefrontItemType;
  itemTypeLabel: string;
  sizeCm: number;
  sizeLabel: string;
  priceKopecks: number;
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  productType: "REGULAR" | "CUSTOM";
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  coverImage: string;
  galleryImages: string[];
  images: StorefrontImage[];
  isFeatured: boolean;
  isCustom: boolean;
  variants: StorefrontVariant[];
  minPriceKopecks: number;
  accent: "violet" | "cyan" | "blue" | "pink";
  motif: string;
};

export type StorefrontHomeData = {
  settings: StorefrontSettings;
  categories: StorefrontCategory[];
  featuredProducts: StorefrontProduct[];
  customProduct: StorefrontProduct | null;
};

export type StorefrontCatalogData = {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
};
