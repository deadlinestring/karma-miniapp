import { describe, expect, it } from "vitest";
import { GET, PATCH } from "./route";

describe("admin product detail route", () => {
  it("does not return product detail without Telegram initData", async () => {
    const response = await GET(new Request("http://localhost/api/admin/products/product-1"), {
      params: { productId: "product-1" }
    });

    expect(response.status).toBe(401);
  });

  it("does not update products without Telegram initData", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/products/product-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Новое название" })
      }),
      { params: { productId: "product-1" } }
    );

    expect(response.status).toBe(401);
  });
});
