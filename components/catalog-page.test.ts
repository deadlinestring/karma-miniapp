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
    expect(source).toContain("neonMaskHover");
    expect(source).toContain("onClick={() => setCategory(item)}");
    expect(source).toContain("ProductCard key={product.id} product={product} onOpen={setOpenedProduct} variant=\"compact\"");
  });

  it("renders catalog content as plain text", () => {
    expect(source).toContain("renderContentBlockLines(introBlock.body)");
    expect(source).toContain("renderContentBlockLines(emptyBlock.body)");
    expect(source).toContain("filteredProducts.length === 0 && emptyBlock");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
