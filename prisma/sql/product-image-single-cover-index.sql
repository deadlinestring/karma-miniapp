-- Add this SQL to the first Prisma migration before applying it to Supabase.
-- PostgreSQL partial unique index: one cover image per product.
CREATE UNIQUE INDEX IF NOT EXISTS "ProductImage_one_cover_per_product"
  ON "ProductImage" ("productId")
  WHERE "isCover" = true;
