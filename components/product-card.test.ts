import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("product card Neon Mask styling", () => {
  const source = readFileSync(join(__dirname, "product-card.tsx"), "utf8");

  it("keeps product navigation and modal open behavior", () => {
    expect(source).toContain("href={`/catalog?product=${product.slug}`}");
    expect(source).toContain("onClick={() => onOpen(product)}");
    expect(source).toContain("<ActionButton");
  });

  it("renders product names, prices and badges without changing pricing", () => {
    expect(source).toContain("{product.name}");
    expect(source).toContain("formatKopecks(product.minPriceKopecks)");
    expect(source).toContain("ProductPrice");
    expect(source).toContain("{product.subcategory}");
    expect(source).toContain("product.isCustom");
  });

  it("uses one calm outer card surface without nested cyan or white frames", () => {
    expect(source).toContain("neonMaskElevatedSurface");
    expect(source).toContain("duration-150");
    expect(source).toContain("hover:-translate-y-px");
    expect(source).not.toContain("whileTap");
    expect(source).toContain("border-t border-neon-violet/15");
    expect(source).not.toContain("border-neon-cyan/12");
    expect(source).not.toContain("border-white/10");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
