import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("admin products route", () => {
  it("does not return products without Telegram initData", async () => {
    const response = await GET(new Request("http://localhost/api/admin/products"));

    expect(response.status).toBe(401);
  });
});
