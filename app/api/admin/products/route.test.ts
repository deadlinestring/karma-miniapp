import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("admin products route", () => {
  it("does not return products without Telegram initData", async () => {
    const response = await GET(new Request("http://localhost/api/admin/products"));

    expect(response.status).toBe(401);
  });

  it("does not create products without Telegram initData", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Новый товар", description: "Описание", subcategoryId: "subcategory-1" })
      })
    );

    expect(response.status).toBe(401);
  });
});
