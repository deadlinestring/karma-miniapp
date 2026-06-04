import { afterEach, describe, expect, it, vi } from "vitest";

describe("YooKassa webhook route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doUnmock("@/lib/server/yookassa-config");
    vi.doUnmock("@/lib/server/yookassa-webhook");
  });

  it("does not process when webhook secret env is missing", async () => {
    const processor = vi.fn();
    vi.doMock("@/lib/server/yookassa-config", () => ({
      getYooKassaWebhookSecret: () => {
        throw new Error("yookassa_webhook_secret_missing");
      }
    }));
    vi.doMock("@/lib/server/yookassa-webhook", () => ({
      processYooKassaWebhook: processor
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/yookassa/webhook?token=secret", {
      method: "POST",
      body: "{}"
    }));

    expect(response.status).toBe(503);
    expect(processor).not.toHaveBeenCalled();
  });

  it("does not process when webhook secret is wrong", async () => {
    const processor = vi.fn();
    vi.doMock("@/lib/server/yookassa-config", () => ({
      getYooKassaWebhookSecret: () => "expected-secret"
    }));
    vi.doMock("@/lib/server/yookassa-webhook", () => ({
      processYooKassaWebhook: processor
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/yookassa/webhook?token=wrong", {
      method: "POST",
      body: "{}"
    }));

    expect(response.status).toBe(401);
    expect(processor).not.toHaveBeenCalled();
  });

  it("accepts matching query token and forwards JSON payload", async () => {
    const processor = vi.fn().mockResolvedValue({ ok: true, action: "ignored", reason: "unsupported_event" });
    vi.doMock("@/lib/server/yookassa-config", () => ({
      getYooKassaWebhookSecret: () => "expected-secret"
    }));
    vi.doMock("@/lib/server/yookassa-webhook", () => ({
      processYooKassaWebhook: processor
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/yookassa/webhook?token=expected-secret", {
      method: "POST",
      body: JSON.stringify({ event: "payment.succeeded" })
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, action: "ignored", reason: "unsupported_event" });
    expect(processor).toHaveBeenCalledWith({ event: "payment.succeeded" });
  });

  it("accepts matching webhook secret header without exposing it", async () => {
    const processor = vi.fn().mockResolvedValue({ ok: true, action: "ignored", reason: "invalid_payload" });
    vi.doMock("@/lib/server/yookassa-config", () => ({
      getYooKassaWebhookSecret: () => "expected-secret"
    }));
    vi.doMock("@/lib/server/yookassa-webhook", () => ({
      processYooKassaWebhook: processor
    }));

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/yookassa/webhook", {
      method: "POST",
      headers: { "X-Karma-Webhook-Secret": "expected-secret" },
      body: "{"
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, action: "ignored", reason: "invalid_json" });
    expect(processor).not.toHaveBeenCalled();
    expect(JSON.stringify(data)).not.toContain("expected-secret");
  });
});
