import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("product modal custom design flow", () => {
  const source = readFileSync(join(__dirname, "product-modal.tsx"), "utf8");

  it("uploads custom design images with Telegram initData header", () => {
    expect(source).toContain('fetch("/api/orders/custom-upload"');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain("window.Telegram?.WebApp?.initData");
    expect(source).toContain("FormData");
  });

  it("requires uploaded image before adding a custom product to cart", () => {
    expect(source).toContain("!product.isCustom || Boolean(customUpload)");
    expect(source).toContain("customImageStoragePath");
    expect(source).toContain("customImageFileName");
    expect(source).toContain("customDrawingStyle");
  });

  it("explains custom review and links to FAQ", () => {
    expect(source).toContain('useContentBlocks(["custom-design-help"])');
    expect(source).toContain("customDesignHelpBlock.ctaHref");
    expect(source).toContain("customDesignHelpBlock.ctaLabel");
    expect(source).toContain("renderContentBlockLines(customDesignHelpBlock.body)");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
