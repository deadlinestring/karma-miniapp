import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin product import apply route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/admin-product-import");
  });

  it("does not apply CSV without Telegram initData", async () => {
    const { POST } = await import("./route");
    const formData = new FormData();
    formData.set("file", new File(["external_id;name;description;category_slug;subcategory_slug;product_type\n"], "products.csv", { type: "text/csv" }));
    formData.set("confirmCreateHiddenProducts", "true");

    const response = await POST(
      new Request("http://localhost/api/admin/import/products/apply", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects apply without confirmation", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-product-import", () => ({
      applyCreateOnlyProductImportFile: vi.fn().mockRejectedValue(new Error("confirm_required"))
    }));

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.set("file", new File(["external_id;name;description;category_slug;subcategory_slug;product_type\n"], "products.csv", { type: "text/csv" }));

    const response = await POST(
      new Request("http://localhost/api/admin/import/products/apply", {
        method: "POST",
        body: formData,
        headers: { "X-Telegram-Init-Data": "valid" }
      })
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toContain("Подтвердите");
  });

  it("returns a safe success summary for a valid admin", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-product-import", () => ({
      applyCreateOnlyProductImportFile: vi.fn().mockResolvedValue({
        createdCount: 1,
        createdProducts: [{ name: "Товар 1", externalId: "item_001" }]
      })
    }));

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.set("file", new File(["external_id;name;description;category_slug;subcategory_slug;product_type\nitem_001;Товар 1;;anime;one-piece;"], "products.csv", { type: "text/csv" }));
    formData.set("confirmCreateHiddenProducts", "true");

    const response = await POST(
      new Request("http://localhost/api/admin/import/products/apply", {
        method: "POST",
        body: formData,
        headers: { "X-Telegram-Init-Data": "valid" }
      })
    );
    const body = (await response.json()) as { result: { createdCount: number } };

    expect(response.status).toBe(200);
    expect(body.result.createdCount).toBe(1);
  });
});
