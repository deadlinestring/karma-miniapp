import { describe, expect, it } from "vitest";

describe("admin subcategory item route", () => {
  it("does not update subcategories without Telegram initData", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/categories/category-1/subcategories/subcategory-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Новая" })
      }),
      { params: { categoryId: "category-1", subcategoryId: "subcategory-1" } }
    );

    expect(response.status).toBe(401);
  });
});
