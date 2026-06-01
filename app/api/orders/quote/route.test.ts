import { afterEach, describe, expect, it, vi } from "vitest";

describe("orders quote route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/order-quote");
  });

  it("returns validation error for an empty body", async () => {
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost/api/orders/quote", { method: "POST" }));
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toContain("корзины");
  });

  it("returns safe validation errors from quote service", async () => {
    class MockOrderQuoteError extends Error {}
    vi.doMock("@/lib/server/order-quote", () => ({
      OrderQuoteError: MockOrderQuoteError,
      quoteOrder: vi.fn().mockRejectedValue(new MockOrderQuoteError("Корзина пуста."))
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: "RUSSIAN_POST", items: [] })
      })
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Корзина пуста.");
  });

  it("returns server quote payload", async () => {
    vi.doMock("@/lib/server/order-quote", () => ({
      OrderQuoteError: class MockOrderQuoteError extends Error {},
      quoteOrder: vi.fn().mockResolvedValue({
        items: [{ productId: "product-1", unitPriceKopecks: 549000 }],
        summary: { totalKopecks: 594000 },
        warnings: []
      })
    }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryMethod: "RUSSIAN_POST", items: [{ productId: "product-1", priceListItemId: "premium-30", quantity: 1 }] })
      })
    );
    const body = (await response.json()) as { ok: boolean; summary: { totalKopecks: number } };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.summary.totalKopecks).toBe(594000);
  });
});
