import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("admin order detail route", () => {
  it("does not return order detail without Telegram initData", async () => {
    const response = await GET(new Request("http://localhost/api/admin/orders/KRM-20260601-805754"), {
      params: { publicNumber: "KRM-20260601-805754" }
    });

    expect(response.status).toBe(401);
  });
});

