-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "page" TEXT,
    "title" TEXT,
    "body" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_slug_key" ON "ContentBlock"("slug");

-- CreateIndex
CREATE INDEX "ContentBlock_isActive_sortOrder_idx" ON "ContentBlock"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ContentBlock_page_isActive_sortOrder_idx" ON "ContentBlock"("page", "isActive", "sortOrder");
