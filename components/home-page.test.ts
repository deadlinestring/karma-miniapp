import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("home page content blocks", () => {
  const source = readFileSync(join(__dirname, "home-page.tsx"), "utf8");

  it("loads hero copy from admin-managed content blocks", () => {
    expect(source).toContain("useContentBlocks(homeContentSlugs)");
    expect(source).toContain("neonMaskBackground");
    expect(source).toContain("neonMaskSurface");
    expect(source).toContain("neonMaskHover");
    expect(source).not.toContain("BrandMaskWatermark");
    expect(source).toContain('"home-hero-eyebrow"');
    expect(source).toContain('"home-hero-title"');
    expect(source).toContain('"home-hero-subtitle"');
    expect(source).toContain('"home-hero-primary-cta"');
    expect(source).toContain('"home-hero-secondary-cta"');
  });

  it("lets inactive home blocks hide corresponding hero elements", () => {
    expect(source).toContain("heroEyebrow ? (");
    expect(source).toContain("primaryCtaLabel ? (");
    expect(source).toContain("secondaryCtaLabel && data.customProduct ? (");
    expect(source).not.toContain("НОЧНИКИ ПО ТВОЕЙ ИДЕЕ");
  });

  it("keeps StoreSettings as fallback for hero title and subtitle", () => {
    expect(source).toContain("contentBlockText(heroTitleBlock) ?? data.settings.heroTitle");
    expect(source).toContain("contentBlockText(heroSubtitleBlock) ?? data.settings.heroSubtitle");
  });

  it("keeps hero CTA actions stable through the visual redesign", () => {
    expect(source).toContain("uiButtonClassName");
    expect(source).toContain('href={primaryCtaBlock?.ctaHref ?? "/catalog"}');
    expect(source).toContain("setOpenedProduct(data.customProduct)");
    expect(source).toContain('type="button"');
  });

  it("separates the stable hero media zone from the text panel", () => {
    expect(source).toContain('section className="grid gap-3"');
    expect(source).toContain("aspect-[16/10]");
    expect(source).toContain("h-full w-full object-contain object-center");
    expect(source).not.toContain("absolute inset-0 z-0 h-full w-full object-cover");
    expect(source).not.toContain('variant="hero"');
  });

  it("renders content as React text without executing HTML", () => {
    expect(source).toContain("{heroEyebrow}");
    expect(source).toContain("{heroTitle}");
    expect(source).toContain("{heroSubtitle}");
    expect(source).toContain("neonMaskGradientText");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
