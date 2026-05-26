import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin product import panel", () => {
  const source = readFileSync(join(__dirname, "admin-product-import-panel.tsx"), "utf8");

  it("downloads the CSV template through authenticated fetch instead of a plain link", () => {
    expect(source).toContain('fetch("/api/admin/import/products/template"');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain("URL.createObjectURL(blob)");
    expect(source).not.toContain('href="/api/admin/import/products/template"');
  });

  it("keeps raw initData only in memory and request headers", () => {
    expect(source).not.toContain("localStorage");
    expect(source).not.toMatch(/initData=.*href/);
  });
});
