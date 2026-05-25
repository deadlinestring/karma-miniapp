import { describe, expect, it } from "vitest";
import { DELETE } from "./route";

describe("admin product delete image route", () => {
  it("rejects image deletion without Telegram initData", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/admin/products/product-1/images/image-1", {
        method: "DELETE"
      }),
      { params: { productId: "product-1", imageId: "image-1" } }
    );

    expect(response.status).toBe(401);
  });
});
