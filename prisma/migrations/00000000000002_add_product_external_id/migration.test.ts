import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("add product externalId migration", () => {
  const sql = readFileSync(join(__dirname, "migration.sql"), "utf8");

  it("matches nullable Prisma @unique semantics without a partial WHERE clause", () => {
    expect(sql).toContain('ALTER TABLE "Product" ADD COLUMN "externalId" TEXT;');
    expect(sql).toContain('CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");');
    expect(sql).not.toContain('WHERE "externalId" IS NOT NULL');
  });

  it("does not contain destructive data operations", () => {
    expect(sql).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP\s+COLUMN\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
  });
});
