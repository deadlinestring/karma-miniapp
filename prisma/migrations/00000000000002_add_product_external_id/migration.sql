-- Add a stable external identifier for future CSV product imports.
ALTER TABLE "Product" ADD COLUMN "externalId" TEXT;

CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");
