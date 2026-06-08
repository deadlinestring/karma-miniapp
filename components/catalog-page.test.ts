import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("catalog page content blocks", () => {
  const source = readFileSync(join(__dirname, "catalog-page.tsx"), "utf8");

  it("uses content blocks for catalog intro and empty state", () => {
    expect(source).toContain("useContentBlocks(catalogContentSlugs)");
    expect(source).toContain('import { EmptyState }');
    expect(source).toContain('import { Surface }');
    expect(source).toContain('"catalog-intro-help"');
    expect(source).toContain('"catalog-empty-state"');
    expect(source).toContain("introBlock?.title");
    expect(source).toContain("bodyLines={emptyBlock.body ? renderContentBlockLines(emptyBlock.body) : []}");
  });

  it("keeps catalog filtering behavior while applying Neon Mask surfaces", () => {
    expect(source).toContain('tone="mask"');
    expect(source).toContain("neonMaskGradientText");
    expect(source).toContain("onClick={() => setCategory(item)}");
    expect(source).toContain("ProductCard key={product.id} product={product} onOpen={setOpenedProduct} variant=\"compact\"");
  });

  it("keeps category chips borders stable and prevents clipping at the end of the row", () => {
    expect(source).toContain("overflow-x-auto px-1 pb-2 pr-5");
    expect(source).toContain("h-11 shrink-0 rounded-2xl border px-4");
    expect(source).toContain("focus-visible:ring-2 focus-visible:ring-neon-cyan/70");
    expect(source).toContain("hover:border-neon-cyan/35");
    expect(source).not.toContain("rounded-2xl px-4 text-sm font-bold ${neonMaskHover}");
  });

  it("renders catalog content as plain text", () => {
    expect(source).toContain("renderContentBlockLines(introBlock.body)");
    expect(source).toContain("renderContentBlockLines(emptyBlock.body)");
    expect(source).toContain("filteredProducts.length === 0 && emptyBlock");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
