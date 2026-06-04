import { afterEach, describe, expect, it, vi } from "vitest";

describe("public content blocks route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/content-blocks");
  });

  it("returns active public content blocks for requested slugs", async () => {
    const getPublicContentBlocks = vi.fn().mockResolvedValue([
      { slug: "payment-disabled-guidance", title: "Payment soon", isActive: true }
    ]);
    vi.doMock("@/lib/server/content-blocks", () => ({
      getPublicContentBlocks
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/content-blocks?slugs=payment-disabled-guidance"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getPublicContentBlocks).toHaveBeenCalledWith(["payment-disabled-guidance"]);
    expect(body).toEqual({
      ok: true,
      blocks: [{ slug: "payment-disabled-guidance", title: "Payment soon", isActive: true }]
    });
  });
});
