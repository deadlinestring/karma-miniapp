-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceListId" TEXT;

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "sizeCm" INTEGER NOT NULL,
    "priceKopecks" INTEGER NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_slug_key" ON "PriceList"("slug");

-- CreateIndex
CREATE INDEX "PriceList_isActive_idx" ON "PriceList"("isActive");

-- CreateIndex
CREATE INDEX "PriceListItem_priceListId_isActive_sortOrder_idx" ON "PriceListItem"("priceListId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_itemType_sizeCm_key" ON "PriceListItem"("priceListId", "itemType", "sizeCm");

-- CreateIndex
CREATE INDEX "Product_priceListId_idx" ON "Product"("priceListId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for new public schema tables.
-- Public policies are intentionally not created at this stage.
ALTER TABLE "PriceList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceListItem" ENABLE ROW LEVEL SECURITY;
