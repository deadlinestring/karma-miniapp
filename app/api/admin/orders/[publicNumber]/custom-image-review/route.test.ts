import { afterEach, describe, expect, it, vi } from "vitest";

describe("admin order custom image review route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/admin-auth");
    vi.doUnmock("@/lib/server/admin-orders");
  });

  it("does not update custom image review without Telegram initData", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/orders/KRM-20260602-8E3EBA/custom-image-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" })
      }),
      { params: { publicNumber: "KRM-20260602-8E3EBA" } }
    );

    expect(response.status).toBe(401);
  });

  it("passes review payload to the repository for an admin request", async () => {
    const updateAdminOrderCustomImageReview = vi.fn().mockResolvedValue({ publicNumber: "KRM-20260602-8E3EBA" });
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-orders", () => ({
      updateAdminOrderCustomImageReview
    }));

    const { PATCH } = await import("./route");
    const payload = { status: "REJECTED", reason: "Не подходит" };
    const response = await PATCH(
      new Request("http://localhost/api/admin/orders/KRM-20260602-8E3EBA/custom-image-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
      { params: { publicNumber: "KRM-20260602-8E3EBA" } }
    );

    expect(response.status).toBe(200);
    expect(updateAdminOrderCustomImageReview).toHaveBeenCalledWith("KRM-20260602-8E3EBA", payload);
  });

  it("returns a safe message when reject reason is missing", async () => {
    vi.doMock("@/lib/server/admin-auth", () => ({
      requireTelegramAdmin: () => ({ ok: true, user: { id: "admin" } })
    }));
    vi.doMock("@/lib/server/admin-orders", () => ({
      updateAdminOrderCustomImageReview: vi.fn().mockRejectedValue(new Error("custom_image_reject_reason_required"))
    }));

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/orders/KRM-20260602-8E3EBA/custom-image-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" })
      }),
      { params: { publicNumber: "KRM-20260602-8E3EBA" } }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Укажите причину отклонения изображения.");
  });
});
