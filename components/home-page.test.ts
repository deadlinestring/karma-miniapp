import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("home page content blocks", () => {
  const source = readFileSync(join(__dirname, "home-page.tsx"), "utf8");

  it("loads hero copy from admin-managed content blocks", () => {
    expect(source).toContain("useContentBlocks(homeContentSlugs)");
    expect(source).toContain("BrandMaskWatermark");
    expect(source).toContain("neonMaskBackground");
    expect(source).toContain("neonMaskSurface");
    expect(source).toContain("neonMaskHover");
    expect(source.match(/<BrandMaskWatermark/g)?.length).toBe(1);
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

  it("keeps the hero background sharp while layering the mask above the glass panel", () => {
    expect(source).toContain("relative isolate min-h-[560px]");
    expect(source).toContain("absolute inset-0 z-0 h-full w-full object-cover opacity-78");
    expect(source).not.toContain("blur-sm");
    expect(source).not.toContain("filter");
    expect(source).toContain('BrandMaskWatermark variant="hero" className="absolute -right-28 top-12 z-30');
    expect(source).toContain("absolute inset-0 z-20 rounded-[28px]");
    expect(source).toContain("relative z-40");
  });

  it("renders content as React text without executing HTML", () => {
    expect(source).toContain("{heroEyebrow}");
    expect(source).toContain("{heroTitle}");
    expect(source).toContain("{heroSubtitle}");
    expect(source).toContain("neonMaskGradientText");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
