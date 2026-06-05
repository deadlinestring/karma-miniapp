import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin content blocks panel", () => {
  const source = readFileSync(join(__dirname, "admin-content-blocks-panel.tsx"), "utf8");

  it("loads and saves through protected admin content block endpoints", () => {
    expect(source).toContain('fetch("/api/admin/content-blocks"');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain('method: "PATCH"');
    expect(source).toContain("JSON.stringify({ blocks })");
  });

  it("renders editable fields, active toggle and plain-text preview", () => {
    expect(source).toContain("Блоки интерфейса");
    expect(source).toContain("block.isActive");
    expect(source).toContain("ctaLabel");
    expect(source).toContain("ctaHref");
    expect(source).toContain("renderPlainTextPreview");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("shows placement labels for home hero blocks", () => {
    expect(source).toContain('"home-hero-eyebrow"');
    expect(source).toContain('"home-hero-primary-cta"');
    expect(source).toContain('"home-hero-secondary-cta"');
  });
});
