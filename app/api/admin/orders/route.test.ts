import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("admin orders route", () => {
  it("does not return orders without Telegram initData", async () => {
    const response = await GET(new Request("http://localhost/api/admin/orders"));

    expect(response.status).toBe(401);
  });
});

