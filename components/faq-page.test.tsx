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

  it("keeps system sections out of ordinary cards and highlights open cards", () => {
    expect(source).toContain("ordinarySections.map");
    expect(source).toContain("open:border-neon-cyan/45");
    expect(source).toContain("open:bg-neon-cyan/10");
    expect(source).toContain("group-open:rotate-180");
    expect(source).toContain("focus-visible:ring-2");
    expect(source).toContain("motion-reduce:transition-none");
  });
});
