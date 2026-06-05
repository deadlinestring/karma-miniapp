import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("cart page content blocks", () => {
  const source = readFileSync(join(__dirname, "cart-page.tsx"), "utf8");

  it("uses content block for the empty cart state", () => {
    expect(source).toContain('useContentBlocks(["cart-empty-state"])');
    expect(source).toContain('import { EmptyState }');
    expect(source).toContain("title={emptyBlock.title}");
    expect(source).toContain("bodyLines={emptyBlock.body ? renderContentBlockLines(emptyBlock.body) : []}");
    expect(source).toContain("ctaHref={emptyBlock.ctaHref}");
  });

  it("renders empty cart copy as plain text", () => {
    expect(source).toContain("renderContentBlockLines(emptyBlock.body)");
    expect(source).toContain("items.length === 0 && emptyBlock");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
