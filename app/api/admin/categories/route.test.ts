import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin categories route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/admin-categories");
  });

  it("does not return categories without Telegram initData", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/categories"));

    expect(response.status).toBe(401);
  });

  it("does not create categories without Telegram initData", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: "Новое" })
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns categories for a valid admin request", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-categories", () => ({
      getAdminCategoryTree: vi.fn().mockResolvedValue({ categories: [] }),
      createAdminCategory: vi.fn()
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/categories"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, categoryTree: { categories: [] } });
  });
});
