import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin products panel image previews", () => {
  const source = readFileSync(join(__dirname, "admin-products-panel.tsx"), "utf8");

  it("opens managed product images in the shared lightbox", () => {
    expect(source).toContain('import { ImageLightbox }');
    expect(source).toContain("setLightboxImage({ src: image.url, alt: image.altText ?? product.name })");
    expect(source).toContain("<ImageLightbox src={lightboxImage?.src ?? null}");
    expect(source).toContain("Открыть фотографию товара крупно");
  });

  it("keeps product image management actions unchanged", () => {
    expect(source).toContain("onSetCover(image.id)");
    expect(source).toContain("onDeleteImage(image)");
    expect(source).toContain('onUploadCover={() => uploadImage("cover")}');
    expect(source).toContain('onUploadGallery={() => uploadImage("gallery")}');
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
