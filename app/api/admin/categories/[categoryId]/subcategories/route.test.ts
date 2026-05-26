import { describe, expect, it } from "vitest";

describe("admin subcategories route", () => {
  it("does not create subcategories without Telegram initData", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/categories/category-1/subcategories", {
        method: "POST",
        body: JSON.stringify({ name: "Новая" })
      }),
      { params: { categoryId: "category-1" } }
    );

    expect(response.status).toBe(401);
  });
});
