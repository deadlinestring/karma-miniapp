import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin main price list route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/admin-price-lists");
  });

  it("does not return the price list without Telegram initData", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/price-lists/main"));

    expect(response.status).toBe(401);
  });

  it("does not update the price list without Telegram initData", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/price-lists/main", {
        method: "PATCH",
        body: JSON.stringify({ items: [{ id: "item-1", priceRubles: 2490, note: null }] })
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns a safe main price list for a valid admin request", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-price-lists", () => ({
      getAdminMainPriceList: vi.fn().mockResolvedValue({
        id: "main",
        name: "Основной прайс KARMA",
        slug: "main",
        isActive: true,
        items: []
      }),
      updateAdminMainPriceList: vi.fn()
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/price-lists/main"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      priceList: {
        id: "main",
        name: "Основной прайс KARMA",
        slug: "main",
        isActive: true,
        items: []
      }
    });
  });

  it("passes validated PATCH work to the repository for a valid admin request", async () => {
    const updateAdminMainPriceList = vi.fn().mockResolvedValue({
      id: "main",
      name: "Основной прайс KARMA",
      slug: "main",
      isActive: true,
      items: []
    });
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-price-lists", () => ({
      getAdminMainPriceList: vi.fn(),
      updateAdminMainPriceList
    }));

    const { PATCH } = await import("./route");
    const payload = { items: [{ id: "item-1", priceRubles: 2490, note: " note " }] };
    const response = await PATCH(
      new Request("http://localhost/api/admin/price-lists/main", {
        method: "PATCH",
        body: JSON.stringify(payload)
      })
    );

    expect(response.status).toBe(200);
    expect(updateAdminMainPriceList).toHaveBeenCalledWith(payload);
  });
});
