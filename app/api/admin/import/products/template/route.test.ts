import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin product import template route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
  });

  it("does not return the template without Telegram initData", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/import/products/template"));

    expect(response.status).toBe(401);
  });

  it("returns a BOM-prefixed CSV template for a valid admin", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/import/products/template"));
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(text).toContain("external_id;name;description;category_slug;subcategory_slug;product_type");
    expect(text.trim().split(/\r?\n/)).toHaveLength(1);
  });
});
