import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FAQ_SECTIONS,
  FAQ_CONTACT_CTA_SLUG,
  FAQ_HERO_SLUG,
  getFaqSectionBySlug,
  getOrdinaryFaqSections,
  getAdminFaqSectionsWithServices,
  getPublicFaqSectionsWithServices,
  updateAdminFaqSectionsWithServices,
  validateFaqSectionsInput
} from "./faq";

function makeSection(overrides: Partial<(typeof DEFAULT_FAQ_SECTIONS)[number]> = {}) {
  return {
    ...DEFAULT_FAQ_SECTIONS[0],
    id: "faq-1",
    slug: "about-karma-lights",
    sortOrder: 10,
    isActive: true,
    ...overrides
  };
}

describe("FAQ repository", () => {
  it("returns active public sections from storage", async () => {
    const findMany = vi.fn().mockResolvedValue([makeSection()]);
    const sections = await getPublicFaqSectionsWithServices({ faqSection: { findMany } });

    expect(sections.map((section) => section.slug)).toContain("about-karma-lights");
    expect(sections.find((section) => section.slug === "about-karma-lights")?.id).toBe("faq-1");
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
    });
  });

  it("returns default fallback when FAQ storage is empty or unavailable", async () => {
    const empty = await getPublicFaqSectionsWithServices({
      faqSection: { findMany: vi.fn().mockResolvedValue([]) }
    });
    const adminEmpty = await getAdminFaqSectionsWithServices({
      faqSection: { findMany: vi.fn().mockResolvedValue([]) }
    });
    const failed = await getAdminFaqSectionsWithServices({
      faqSection: { findMany: vi.fn().mockRejectedValue(new Error("missing_table")) }
    });

    expect(empty.map((section) => section.slug)).toContain("how-to-order");
    expect(adminEmpty.map((section) => section.slug)).toContain(FAQ_HERO_SLUG);
    expect(adminEmpty.map((section) => section.slug)).toContain(FAQ_CONTACT_CTA_SLUG);
    expect(adminEmpty.map((section) => section.slug)).toContain("drawing-styles");
    expect(adminEmpty.find((section) => section.slug === "about-karma-lights")).toMatchObject({ isActive: true });
    expect(failed.map((section) => section.slug)).toContain("custom-image-order");
  });

  it("public returns only active FAQ sections after merging storage with fallback", async () => {
    const findMany = vi.fn().mockResolvedValue([
      makeSection({ slug: "how-to-order", title: "Active" }),
      makeSection({ slug: "drawing-styles", title: "Hidden", isActive: false })
    ]);
    const sections = await getPublicFaqSectionsWithServices({ faqSection: { findMany } });

    expect(sections.map((section) => section.slug)).not.toContain("drawing-styles");
  });

  it("uses saved hero and CTA sections when present", async () => {
    const findMany = vi.fn().mockResolvedValue([
      makeSection({ slug: FAQ_HERO_SLUG, title: "Saved title", content: "Saved intro", sortOrder: 1 }),
      makeSection({ slug: FAQ_CONTACT_CTA_SLUG, title: "Saved CTA", content: "Saved contact", sortOrder: 1000 })
    ]);
    const sections = await getPublicFaqSectionsWithServices({ faqSection: { findMany } });

    expect(getFaqSectionBySlug(sections, FAQ_HERO_SLUG)).toMatchObject({ title: "Saved title", content: "Saved intro" });
    expect(getFaqSectionBySlug(sections, FAQ_CONTACT_CTA_SLUG)).toMatchObject({ title: "Saved CTA", content: "Saved contact" });
  });

  it("keeps system sections out of ordinary FAQ cards", () => {
    const sections = [
      ...DEFAULT_FAQ_SECTIONS,
      makeSection({ slug: FAQ_HERO_SLUG, title: "Hero", sortOrder: 1 }),
      makeSection({ slug: FAQ_CONTACT_CTA_SLUG, title: "CTA", sortOrder: 1000 })
    ];

    expect(getOrdinaryFaqSections(sections).map((section) => section.slug)).not.toContain(FAQ_HERO_SLUG);
    expect(getOrdinaryFaqSections(sections).map((section) => section.slug)).not.toContain(FAQ_CONTACT_CTA_SLUG);
  });

  it("validates editable FAQ sections and rejects unknown or unsafe payloads", () => {
    const valid = validateFaqSectionsInput({
      sections: [
        {
          slug: "how-to-order",
          title: " Как заказать ",
          content: " Plain text <script>alert(1)</script> ",
          sortOrder: 20,
          isActive: true
        }
      ]
    });

    expect(valid[0]).toMatchObject({
      slug: "how-to-order",
      title: "Как заказать",
      content: "Plain text <script>alert(1)</script>",
      sortOrder: 20,
      isActive: true
    });
    expect(() =>
      validateFaqSectionsInput({ sections: [{ slug: "unknown", title: "Title", content: "Text", sortOrder: 1 }] })
    ).toThrow("invalid_faq_payload");
    expect(() =>
      validateFaqSectionsInput({ sections: [{ slug: "how-to-order", title: "", content: "Text", sortOrder: 1 }] })
    ).toThrow("invalid_faq_payload");
    expect(() =>
      validateFaqSectionsInput({
        sections: [
          { slug: "how-to-order", title: "Title", content: "Text", sortOrder: 1 },
          { slug: "how-to-order", title: "Title", content: "Text", sortOrder: 2 }
        ]
      })
    ).toThrow("invalid_faq_payload");
  });

  it("saves FAQ sections through upsert transaction", async () => {
    const upsert = vi.fn((args) => args);
    const transaction = vi.fn().mockResolvedValue(undefined);
    const findMany = vi.fn().mockResolvedValue([makeSection({ title: "Saved" })]);
    const sections = await updateAdminFaqSectionsWithServices(
      {
        sections: [{ slug: "how-to-order", title: "Как заказать", content: "Текст", sortOrder: 20, isActive: false }]
      },
      {
        faqSection: { findMany, upsert },
        $transaction: transaction
      }
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "how-to-order" },
        create: expect.objectContaining({ slug: "how-to-order", isActive: false }),
        update: expect.objectContaining({ title: "Как заказать", content: "Текст", sortOrder: 20, isActive: false })
      })
    );
    expect(transaction).toHaveBeenCalledWith([expect.any(Object)]);
    expect(sections.find((section) => section.slug === "about-karma-lights")?.title).toBe("Saved");
  });

  it("can initialize default FAQ sections through admin upsert", async () => {
    const upsert = vi.fn((args) => args);
    const transaction = vi.fn().mockResolvedValue(undefined);
    const findMany = vi.fn().mockResolvedValue(DEFAULT_FAQ_SECTIONS.map((section) => ({ ...section, id: `db-${section.slug}` })));
    const sections = await updateAdminFaqSectionsWithServices(
      { sections: DEFAULT_FAQ_SECTIONS.map(({ slug, title, content, sortOrder, isActive }) => ({ slug, title, content, sortOrder, isActive })) },
      {
        faqSection: { findMany, upsert },
        $transaction: transaction
      }
    );

    expect(upsert).toHaveBeenCalledTimes(DEFAULT_FAQ_SECTIONS.length);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "about-karma-lights" },
        create: expect.objectContaining({ slug: "about-karma-lights" })
      })
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: FAQ_HERO_SLUG },
        create: expect.objectContaining({ slug: FAQ_HERO_SLUG })
      })
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: FAQ_CONTACT_CTA_SLUG },
        create: expect.objectContaining({ slug: FAQ_CONTACT_CTA_SLUG })
      })
    );
    expect(sections).toHaveLength(DEFAULT_FAQ_SECTIONS.length);
  });
});
