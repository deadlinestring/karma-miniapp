import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("admin settings upload route", () => {
  it("rejects upload without Telegram initData before storage work", async () => {
    const formData = new FormData();
    formData.set("kind", "logo");
    formData.set("file", new File([new Uint8Array(32)], "logo.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/admin/settings/upload", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(401);
  });
});
