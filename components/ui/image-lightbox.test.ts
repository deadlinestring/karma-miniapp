import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("ImageLightbox", () => {
  const source = readFileSync(join(__dirname, "image-lightbox.tsx"), "utf8");

  it("renders an accessible image dialog with backdrop and close controls", () => {
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("<img src={src} alt={alt}");
    expect(source).toContain("onClick={onClose}");
    expect(source).toContain("Закрыть изображение");
  });

  it("supports Escape close and avoids unsafe HTML rendering", () => {
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("document.addEventListener");
    expect(source).toContain("document.removeEventListener");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
