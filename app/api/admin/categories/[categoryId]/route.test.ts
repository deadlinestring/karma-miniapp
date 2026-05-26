import { describe, expect, it } from "vitest";

describe("admin category item route", () => {
  it("does not update categories without Telegram initData", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/categories/category-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Новое" })
      }),
      { params: { categoryId: "category-1" } }
    );

    expect(response.status).toBe(401);
  });
});
