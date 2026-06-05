import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("catalog page content blocks", () => {
  const source = readFileSync(join(__dirname, "catalog-page.tsx"), "utf8");

  it("uses content blocks for catalog intro and empty state", () => {
    expect(source).toContain("useContentBlocks(catalogContentSlugs)");
    expect(source).toContain('"catalog-intro-help"');
    expect(source).toContain('"catalog-empty-state"');
    expect(source).toContain("introBlock?.title");
    expect(source).toContain("emptyBlock?.body");
  });

  it("renders catalog content as plain text", () => {
    expect(source).toContain("renderContentBlockLines(introBlock.body)");
    expect(source).toContain("renderContentBlockLines(emptyBlock.body)");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
