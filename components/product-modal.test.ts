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
    expect(source).toContain('"custom-design-help"');
    expect(source).toContain("customDesignHelpBlock.ctaHref");
    expect(source).toContain("customDesignHelpBlock.ctaLabel");
    expect(source).toContain("renderContentBlockLines(customDesignHelpBlock.body)");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("uses content blocks for product features and upload requirements", () => {
    expect(source).toContain('"custom-product-features-help"');
    expect(source).toContain('"custom-upload-requirements-help"');
    expect(source).toContain("renderContentBlockLines(customProductFeaturesBlock.body)");
    expect(source).toContain("customUploadRequirementsBlock?.title");
    expect(source).toContain("customUploadRequirementsBlock?.body");
  });

  it("uses Neon Mask visual surfaces without changing modal controls", () => {
    expect(source).toContain("neonMaskSurface");
    expect(source).toContain("neonMaskGradientText");
    expect(source).toContain("neonMaskHover");
    expect(source).toContain('<Surface tone="mask"');
    expect(source).toContain("ProductVisual product={{ ...product, coverImage: visibleImage }} priority");
    expect(source).toContain('type="button"');
    expect(source).toContain("onClick={() => setSelectedType(type)}");
    expect(source).toContain("onClick={() => setSelectedVariantId(variant.priceListItemId)}");
    expect(source).toContain("onClick={() => setSelectedCustomStyle(option.value)}");
    expect(source).toContain("onClick={handleAdd}");
  });

  it("opens product images in the shared lightbox without changing gallery state", () => {
    expect(source).toContain('import { ImageLightbox }');
    expect(source).toContain("setLightboxImage({ src: visibleImage, alt: visibleImageAlt })");
    expect(source).toContain("setActiveImage(image);");
    expect(source).toContain("setLightboxImage({ src: image");
    expect(source).toContain("<ImageLightbox src={lightboxImage?.src ?? null}");
  });
});
