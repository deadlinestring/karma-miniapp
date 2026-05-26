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

  it("sends the original CSV file to apply with authenticated fetch", () => {
    expect(source).toContain('fetch("/api/admin/import/products/apply"');
    expect(source).toContain('formData.set("file", file)');
    expect(source).toContain('formData.set("confirmCreateHiddenProducts", "true")');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).not.toContain("JSON.stringify(preview");
  });

  it("shows apply only after a clean CREATE-only preview", () => {
    expect(source).toContain("preview.createCount > 0 && preview.updateCount === 0 && preview.errorCount === 0");
    expect(source).toContain("Создать скрытые товары");
    expect(source).toContain("Исправьте ошибки в CSV");
    expect(source).toContain("Обновление существующих импортированных товаров пока не поддерживается");
  });
});
