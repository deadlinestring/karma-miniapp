import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("admin product image upload route", () => {
  it("rejects upload without Telegram initData before storage work", async () => {
    const formData = new FormData();
    formData.set("kind", "gallery");
    formData.set("file", new File([new Uint8Array(32)], "image.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/admin/products/product-1/images", {
        method: "POST",
        body: formData
      }),
      { params: { productId: "product-1" } }
    );

    expect(response.status).toBe(401);
  });
});
