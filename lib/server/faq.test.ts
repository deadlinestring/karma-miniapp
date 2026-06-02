import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FAQ_SECTIONS,
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

    expect(sections).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true },
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
    expect(adminEmpty.map((section) => section.slug)).toContain("drawing-styles");
    expect(adminEmpty[0]).toMatchObject({ slug: "about-karma-lights", isActive: true });
    expect(failed.map((section) => section.slug)).toContain("custom-image-order");
  });

  it("public reads only active FAQ sections from storage", async () => {
    const findMany = vi.fn().mockResolvedValue([makeSection({ slug: "how-to-order", title: "Active" })]);
    await getPublicFaqSectionsWithServices({ faqSection: { findMany } });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true }
      })
    );
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
    expect(sections[0].title).toBe("Saved");
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
    expect(sections).toHaveLength(DEFAULT_FAQ_SECTIONS.length);
  });
});
