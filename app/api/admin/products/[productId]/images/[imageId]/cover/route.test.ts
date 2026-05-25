import { describe, expect, it } from "vitest";
import { PATCH } from "./route";

describe("admin product set cover route", () => {
  it("rejects cover changes without Telegram initData", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/products/product-1/images/image-1/cover", {
        method: "PATCH"
      }),
      { params: { productId: "product-1", imageId: "image-1" } }
    );

    expect(response.status).toBe(401);
  });
});
