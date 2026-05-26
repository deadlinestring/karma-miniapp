import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("admin product import preview route", () => {
  it("does not preview CSV without Telegram initData", async () => {
    const formData = new FormData();
    formData.set("file", new File(["external_id;name;description;category_slug;subcategory_slug;product_type\n"], "products.csv", { type: "text/csv" }));

    const response = await POST(
      new Request("http://localhost/api/admin/import/products/preview", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(401);
  });
});
