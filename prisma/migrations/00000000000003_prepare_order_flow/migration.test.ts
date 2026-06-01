import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(join(__dirname, "migration.sql"), "utf8");

describe("prepare order flow migration", () => {
  it("is additive and avoids destructive SQL", () => {
    expect(migrationSql).toContain('ALTER TABLE "Order"');
    expect(migrationSql).toContain('ALTER TABLE "OrderItem"');
    expect(migrationSql).toContain('ALTER TABLE "DeliveryAddress"');
    expect(migrationSql).toContain('CREATE TYPE "CustomDrawingStyle"');
    expect(migrationSql).toContain('CREATE TYPE "CustomImageReviewStatus"');
    expect(migrationSql).toContain('CREATE TYPE "DeliveryMethod"');

    expect(migrationSql).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(migrationSql).not.toMatch(/\bDROP\s+COLUMN\b/i);
    expect(migrationSql).not.toMatch(/\bTRUNCATE\b/i);
    expect(migrationSql).not.toMatch(/\bDELETE\b/i);
    expect(migrationSql).not.toMatch(/\bUPDATE\b/i);
  });

  it("adds order totals and custom image review snapshots", () => {
    expect(migrationSql).toContain('"itemsSubtotalKopecks"');
    expect(migrationSql).toContain('"customDrawingKopecks"');
    expect(migrationSql).toContain('"deliveryMethod"');
    expect(migrationSql).toContain('"deliveryKopecks"');
    expect(migrationSql).toContain('"discountKopecks"');
    expect(migrationSql).toContain('"priceListItemId"');
    expect(migrationSql).toContain('"customDesignKey"');
    expect(migrationSql).toContain('"customImageStoragePath"');
    expect(migrationSql).toContain('"customImageReviewStatus"');
  });
});
