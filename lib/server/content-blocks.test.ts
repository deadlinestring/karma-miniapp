import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CONTENT_BLOCKS,
  getAdminContentBlocksWithServices,
  getPublicContentBlocksWithServices,
  updateAdminContentBlocksWithServices,
  validateContentBlocksInput
} from "./content-blocks";

function makeServices(blocks: any[] = []) {
  return {
    contentBlock: {
      findMany: vi.fn().mockResolvedValue(blocks),
      upsert: vi.fn()
    },
    $transaction: vi.fn(async (operations: unknown[]) => operations)
  };
}

describe("content blocks repository", () => {
  it("returns editable default drafts for admin when DB is empty", async () => {
    const services = makeServices([]);
    const blocks = await getAdminContentBlocksWithServices(services);

    expect(blocks.map((block) => block.slug)).toEqual(DEFAULT_CONTENT_BLOCKS.map((block) => block.slug));
    expect(blocks).toContainEqual(expect.objectContaining({ slug: "checkout-delivery-help", isActive: true }));
    expect(blocks).toContainEqual(expect.objectContaining({ slug: "home-hero-eyebrow", page: "home", isActive: true }));
    expect(blocks).toContainEqual(expect.objectContaining({ slug: "cart-empty-state", page: "cart", isActive: true }));
    expect(blocks).toContainEqual(expect.objectContaining({ slug: "custom-upload-requirements-help", page: "product", isActive: true }));
  });

  it("returns only active public blocks and lets inactive DB rows hide defaults", async () => {
    const services = makeServices([
      {
        id: "saved-payment-disabled",
        slug: "payment-disabled-guidance",
        page: "orders",
        title: "Hidden",
        body: "Hidden",
        ctaLabel: null,
        ctaHref: null,
        sortOrder: 30,
        isActive: false
      }
    ]);

    const blocks = await getPublicContentBlocksWithServices(["payment-disabled-guidance"], services);

    expect(blocks).toEqual([]);
  });

  it("lets an inactive home hero eyebrow hide the storefront label", async () => {
    const services = makeServices([
      {
        id: "saved-home-eyebrow",
        slug: "home-hero-eyebrow",
        page: "home",
        title: "Hidden",
        body: null,
        ctaLabel: null,
        ctaHref: null,
        sortOrder: 1,
        isActive: false
      }
    ]);

    const blocks = await getPublicContentBlocksWithServices(["home-hero-eyebrow"], services);

    expect(blocks).toEqual([]);
  });

  it("lets inactive cleanup blocks hide their public UI", async () => {
    const services = makeServices([
      {
        id: "saved-cart-empty",
        slug: "cart-empty-state",
        page: "cart",
        title: "Hidden",
        body: "Hidden",
        ctaLabel: null,
        ctaHref: null,
        sortOrder: 8,
        isActive: false
      }
    ]);

    const blocks = await getPublicContentBlocksWithServices(["cart-empty-state"], services);

    expect(blocks).toEqual([]);
  });

  it("falls back to default public blocks when the table is unavailable", async () => {
    const services = {
      contentBlock: {
        findMany: vi.fn().mockRejectedValue(new Error("relation_missing"))
      }
    };

    const blocks = await getPublicContentBlocksWithServices(["custom-design-help"], services);

    expect(blocks).toContainEqual(expect.objectContaining({ slug: "custom-design-help", isActive: true }));
  });

  it("returns home hero defaults when saved rows are missing", async () => {
    const services = makeServices([]);
    const blocks = await getPublicContentBlocksWithServices(["home-hero-eyebrow", "home-hero-primary-cta"], services);

    expect(blocks).toContainEqual(expect.objectContaining({ slug: "home-hero-eyebrow", title: "НОЧНИКИ ПО ТВОЕЙ ИДЕЕ" }));
    expect(blocks).toContainEqual(expect.objectContaining({ slug: "home-hero-primary-cta", ctaHref: "/catalog" }));
  });

  it("returns cleanup defaults when saved rows are missing", async () => {
    const services = makeServices([]);
    const blocks = await getPublicContentBlocksWithServices(["catalog-empty-state", "cart-empty-state"], services);

    expect(blocks).toContainEqual(expect.objectContaining({ slug: "catalog-empty-state", title: "Ничего не найдено" }));
    expect(blocks).toContainEqual(expect.objectContaining({ slug: "cart-empty-state", ctaHref: "/catalog" }));
  });

  it("upserts validated blocks by slug", async () => {
    const services = makeServices([]);
    const payload = {
      blocks: [
        {
          slug: "support-cta",
          page: "orders",
          title: "Help",
          body: "Write us",
          ctaLabel: "Contact",
          ctaHref: "https://t.me/karmashopsupportbot",
          sortOrder: 60,
          isActive: true
        }
      ]
    };

    await updateAdminContentBlocksWithServices(payload, services);

    expect(services.contentBlock.upsert).toHaveBeenCalledWith({
      where: { slug: "support-cta" },
      create: payload.blocks[0],
      update: {
        page: "orders",
        title: "Help",
        body: "Write us",
        ctaLabel: "Contact",
        ctaHref: "https://t.me/karmashopsupportbot",
        sortOrder: 60,
        isActive: true
      }
    });
    expect(services.$transaction).toHaveBeenCalledTimes(1);
  });

  it("keeps HTML/script content as plain text input", () => {
    const [block] = validateContentBlocksInput({
      blocks: [
        {
          slug: "checkout-delivery-help",
          title: "<script>alert(1)</script>",
          body: "<b>Delivery</b>",
          sortOrder: 10,
          isActive: true
        }
      ]
    });

    expect(block.title).toBe("<script>alert(1)</script>");
    expect(block.body).toBe("<b>Delivery</b>");
  });

  it("rejects unknown slugs and unsafe CTA links", () => {
    expect(() =>
      validateContentBlocksInput({
        blocks: [{ slug: "unknown-block", title: "x", body: "x", sortOrder: 1, isActive: true }]
      })
    ).toThrow("invalid_content_blocks_payload");

    expect(() =>
      validateContentBlocksInput({
        blocks: [
          {
            slug: "support-cta",
            title: "x",
            body: "x",
            ctaHref: "javascript:alert(1)",
            sortOrder: 1,
            isActive: true
          }
        ]
      })
    ).toThrow("invalid_content_blocks_payload");
  });
});
