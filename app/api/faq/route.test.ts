import { afterEach, describe, expect, it, vi } from "vitest";

describe("public FAQ route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/faq");
  });

  it("returns public FAQ sections", async () => {
    vi.doMock("@/lib/server/faq", () => ({
      getPublicFaqSections: vi.fn().mockResolvedValue([{ slug: "how-to-order", title: "Как заказать", content: "Text" }])
    }));

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      sections: [{ slug: "how-to-order", title: "Как заказать", content: "Text" }]
    });
  });
});
