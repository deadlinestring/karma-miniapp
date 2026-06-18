import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("top bar logo source", () => {
  const source = readFileSync(join(__dirname, "top-bar.tsx"), "utf8");

  it("uses uploaded StoreSettings logo when available and keeps the KARMA fallback", () => {
    expect(source).toContain("settings?.logoUrl");
    expect(source).toContain("<img src={settings.logoUrl} alt={storeName}");
    expect(source).toContain('"K"');
    expect(source).toContain('settings?.storeName || "KARMA"');
    expect(source).toContain('settings?.subtitle ||');
  });

  it("keeps the logo decorative container linked to the home page", () => {
    expect(source).toContain('href="/"');
    expect(source).toContain('aria-label="');
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("keeps the cart action visible and linked", () => {
    expect(source).toContain('href="/cart"');
    expect(source).toContain("<ShoppingBag");
    expect(source).toContain('aria-label="Открыть корзину"');
  });
});
