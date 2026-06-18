import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FAQ page UI", () => {
  const source = readFileSync(join(__dirname, "faq-page.tsx"), "utf8");

  it("renders public FAQ content and support link safely", () => {
    expect(source).toContain("getFaqSectionBySlug(sections, FAQ_HERO_SLUG)");
    expect(source).toContain("getFaqSectionBySlug(sections, FAQ_CONTACT_CTA_SLUG)");
    expect(source).toContain("getOrdinaryFaqSections(sections)");
    expect(source).toContain("Стиль №1");
    expect(source).toContain("Стиль №2");
    expect(source).toContain("Стиль №3");
    expect(source).toContain("karmashopsupportbot");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("keeps system sections out of calm dark violet accordion cards", () => {
    expect(source).toContain("ordinarySections.map");
    expect(source).toContain("open:border-neon-violet/38");
    expect(source).toContain("open:bg-neon-violet/8");
    expect(source).toContain("group-open:rotate-180");
    expect(source).toContain("focus-visible:ring-2");
    expect(source).toContain("motion-reduce:transition-none");
    expect(source).toContain('<Surface as="section" tone="mask"');
    expect(source).toContain('FAQ_HERO_EYEBROW_SLUG');
  });
});
