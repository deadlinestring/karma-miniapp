import { afterEach, describe, expect, it, vi } from "vitest";

describe("orders custom upload route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/telegram-auth");
    vi.doUnmock("@/lib/server/custom-order-upload");
  });

  it("rejects upload without Telegram initData before storage work", async () => {
    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", new File(["x"], "idea.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/orders/custom-upload", {
        method: "POST",
        body: formData
      })
    );

    expect(response.status).toBe(401);
  });

  it("uploads a valid file for a Telegram user and returns a safe snapshot", async () => {
    const uploadCustomOrderImage = vi.fn().mockResolvedValue({
      customDesignKey: "custom-orders/12345/image.webp",
      storagePath: "custom-orders/12345/image.webp",
      fileName: "idea.webp",
      contentType: "image/webp",
      size: 12
    });

    vi.doMock("@/lib/server/telegram-auth", () => ({
      validateTelegramInitData: vi.fn().mockReturnValue({
        ok: true,
        user: { id: "12345", username: "buyer" }
      })
    }));
    vi.doMock("@/lib/server/custom-order-upload", () => ({
      CustomOrderUploadError: class MockCustomOrderUploadError extends Error {},
      uploadCustomOrderImage
    }));

    const { POST } = await import("./route");
    const formData = new FormData();
    const file = new File(["x"], "idea.webp", { type: "image/webp" });
    formData.append("file", file);

    const response = await POST(
      new Request("http://localhost/api/orders/custom-upload", {
        method: "POST",
        headers: { "X-Telegram-Init-Data": "valid" },
        body: formData
      })
    );
    const body = (await response.json()) as {
      ok: boolean;
      upload: { storagePath: string; customDesignKey: string; fileName: string };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.upload).toEqual({
      customDesignKey: "custom-orders/12345/image.webp",
      storagePath: "custom-orders/12345/image.webp",
      fileName: "idea.webp",
      contentType: "image/webp",
      size: 12
    });
    expect(JSON.stringify(body)).not.toContain("url");
    expect(uploadCustomOrderImage).toHaveBeenCalledWith(expect.any(File), {
      id: "12345",
      username: "buyer"
    });
  });
});
