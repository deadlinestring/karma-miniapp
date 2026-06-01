-- Prepare order flow snapshots, delivery/discount totals, and custom drawing review.
-- This migration is additive only and does not create orders or modify catalog data.

CREATE TYPE "CustomDrawingStyle" AS ENUM (
  'CUSTOM_DRAWING_STYLE_1',
  'CUSTOM_DRAWING_STYLE_2',
  'CUSTOM_DRAWING_STYLE_3'
);

CREATE TYPE "CustomImageReviewStatus" AS ENUM (
  'NOT_REQUIRED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "DeliveryMethod" AS ENUM (
  'RUSSIAN_POST'
);

ALTER TABLE "DeliveryAddress"
  ADD COLUMN "addressLine" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "customerTelegramFirstName" TEXT,
  ADD COLUMN "customerTelegramLastName" TEXT,
  ADD COLUMN "customerContact" TEXT,
  ADD COLUMN "adminNotes" TEXT,
  ADD COLUMN "itemsSubtotalKopecks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "customDrawingKopecks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'RUSSIAN_POST',
  ADD COLUMN "deliveryKopecks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountKopecks" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "OrderItem"
  ADD COLUMN "priceListItemId" TEXT,
  ADD COLUMN "productSlugSnapshot" TEXT,
  ADD COLUMN "itemTypeLabelSnapshot" TEXT,
  ADD COLUMN "noteSnapshot" TEXT,
  ADD COLUMN "baseSubtotalKopecks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "customDrawingStyle" "CustomDrawingStyle",
  ADD COLUMN "customDrawingSurchargeKopecks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "customDesignKey" TEXT,
  ADD COLUMN "customImageUrl" TEXT,
  ADD COLUMN "customImageStoragePath" TEXT,
  ADD COLUMN "customImageReviewStatus" "CustomImageReviewStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "customImageReviewComment" TEXT,
  ADD COLUMN "discountKopecks" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "OrderItem_priceListItemId_idx" ON "OrderItem"("priceListItemId");
CREATE INDEX "OrderItem_customImageReviewStatus_idx" ON "OrderItem"("customImageReviewStatus");
