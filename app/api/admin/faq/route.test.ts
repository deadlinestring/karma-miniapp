import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin FAQ route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/faq");
  });

  it("does not return FAQ without Telegram initData", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/faq"));

    expect(response.status).toBe(401);
  });

  it("does not update FAQ without Telegram initData", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/faq", {
        method: "PATCH",
        body: JSON.stringify({ sections: [] })
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns FAQ for a valid admin request", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/faq", () => ({
      getAdminFaqSections: vi.fn().mockResolvedValue([{ slug: "how-to-order", title: "Как заказать" }]),
      updateAdminFaqSections: vi.fn()
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/faq", {
      headers: { "X-Telegram-Init-Data": "valid" }
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, sections: [{ slug: "how-to-order", title: "Как заказать" }] });
  });

  it("passes PATCH payload to the FAQ repository for a valid admin request", async () => {
    const updateAdminFaqSections = vi.fn().mockResolvedValue([{ slug: "how-to-order", title: "Saved" }]);
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/faq", () => ({
      getAdminFaqSections: vi.fn(),
      updateAdminFaqSections
    }));

    const payload = { sections: [{ slug: "how-to-order", title: "Как заказать", content: "Text", sortOrder: 20, isActive: true }] };
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/faq", {
        method: "PATCH",
        headers: { "X-Telegram-Init-Data": "valid" },
        body: JSON.stringify(payload)
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateAdminFaqSections).toHaveBeenCalledWith(payload);
    expect(body).toEqual({ ok: true, sections: [{ slug: "how-to-order", title: "Saved" }] });
  });
});
