import { describe, expect, it } from "vitest";
import { GET, PATCH } from "./route";

describe("admin settings route", () => {
  it("does not return settings without Telegram initData", async () => {
    const response = await GET(new Request("http://localhost/api/admin/settings"));

    expect(response.status).toBe(401);
  });

  it("does not update settings without Telegram initData", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ storeName: "KARMA" })
      })
    );

    expect(response.status).toBe(401);
  });
});
