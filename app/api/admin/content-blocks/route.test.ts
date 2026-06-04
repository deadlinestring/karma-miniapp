import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin content blocks route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/content-blocks");
  });

  it("does not return content blocks without Telegram initData", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/content-blocks"));

    expect(response.status).toBe(401);
  });

  it("does not update content blocks without Telegram initData", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/content-blocks", {
        method: "PATCH",
        body: JSON.stringify({ blocks: [] })
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns editable blocks for a valid admin request", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/content-blocks", () => ({
      getAdminContentBlocks: vi.fn().mockResolvedValue([{ slug: "support-cta", title: "Help" }]),
      updateAdminContentBlocks: vi.fn()
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/content-blocks", {
      headers: { "X-Telegram-Init-Data": "valid" }
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, blocks: [{ slug: "support-cta", title: "Help" }] });
  });

  it("passes PATCH payload to the content block repository", async () => {
    const updateAdminContentBlocks = vi.fn().mockResolvedValue([{ slug: "support-cta", title: "Saved" }]);
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/content-blocks", () => ({
      getAdminContentBlocks: vi.fn(),
      updateAdminContentBlocks
    }));

    const payload = { blocks: [{ slug: "support-cta", title: "Help", body: "Text", sortOrder: 60, isActive: true }] };
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/content-blocks", {
        method: "PATCH",
        headers: { "X-Telegram-Init-Data": "valid" },
        body: JSON.stringify(payload)
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateAdminContentBlocks).toHaveBeenCalledWith(payload);
    expect(body).toEqual({ ok: true, blocks: [{ slug: "support-cta", title: "Saved" }] });
  });
});
