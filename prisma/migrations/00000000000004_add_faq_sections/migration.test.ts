import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FAQ sections migration", () => {
  const sql = readFileSync(join(__dirname, "migration.sql"), "utf8");

  it("creates FAQ sections additively", () => {
    expect(sql).toContain('CREATE TABLE "FaqSection"');
    expect(sql).toContain('"slug" TEXT NOT NULL');
    expect(sql).toContain('"content" TEXT NOT NULL');
    expect(sql).toContain('CREATE UNIQUE INDEX "FaqSection_slug_key"');
    expect(sql).toContain('CREATE INDEX "FaqSection_isActive_sortOrder_idx"');
  });

  it("does not contain destructive SQL or credentials", () => {
    expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN|TRUNCATE|DELETE|UPDATE\s+"|postgresql:\/\//i);
  });
});
