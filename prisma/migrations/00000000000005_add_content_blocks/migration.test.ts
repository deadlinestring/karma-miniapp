import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("content blocks migration", () => {
  const sql = readFileSync(join(__dirname, "migration.sql"), "utf8");

  it("creates the ContentBlock table and expected indexes", () => {
    expect(sql).toContain('CREATE TABLE "ContentBlock"');
    expect(sql).toContain('CREATE UNIQUE INDEX "ContentBlock_slug_key"');
    expect(sql).toContain('CREATE INDEX "ContentBlock_isActive_sortOrder_idx"');
    expect(sql).toContain('CREATE INDEX "ContentBlock_page_isActive_sortOrder_idx"');
  });

  it("is additive-only", () => {
    expect(sql).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP\s+COLUMN\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
    expect(sql).not.toMatch(/DATABASE_URL|SECRET|TOKEN/i);
  });
});
