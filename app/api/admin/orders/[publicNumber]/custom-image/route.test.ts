import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin order custom image route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/admin-orders");
  });

  it("does not create signed URLs without Telegram initData", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/orders/KRM-20260602-8E3EBA/custom-image"), {
      params: { publicNumber: "KRM-20260602-8E3EBA" }
    });

    expect(response.status).toBe(401);
  });

  it("rejects a valid non-admin user", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: false, response: new Response("forbidden", { status: 403 }) })
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/orders/KRM-20260602-8E3EBA/custom-image"), {
      params: { publicNumber: "KRM-20260602-8E3EBA" }
    });

    expect(response.status).toBe(403);
  });

  it("returns a signed URL without exposing the private storage path", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-orders", () => ({
      getAdminOrderCustomImageSignedUrl: vi.fn().mockResolvedValue({
        signedUrl: "https://signed.example/image",
        expiresInSeconds: 120
      })
    }));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/orders/KRM-20260602-8E3EBA/custom-image"), {
      params: { publicNumber: "KRM-20260602-8E3EBA" }
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      image: {
        signedUrl: "https://signed.example/image",
        expiresInSeconds: 120
      }
    });
    expect(JSON.stringify(data)).not.toContain("custom-orders/");
  });
});
