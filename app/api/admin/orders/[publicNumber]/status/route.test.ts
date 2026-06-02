import { describe, expect, it } from "vitest";
import { PATCH } from "./route";

describe("admin order status route", () => {
  it("does not update order status without Telegram initData", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/orders/KRM-20260601-805754/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: "IN_WORK" })
      }),
      { params: { publicNumber: "KRM-20260601-805754" } }
    );

    expect(response.status).toBe(401);
  });
});

