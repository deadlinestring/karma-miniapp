import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { authorizeTelegramAdmin, validateTelegramInitData } from "./telegram-auth";

const botToken = "123456:test_bot_token";
const nowSeconds = 1_700_000_000;
const adminId = "777000111";
const regularUserId = "777000222";

function signInitData(fields: Record<string, string>) {
  const dataCheckString = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const params = new URLSearchParams(fields);
  params.set("hash", hash);
  return params.toString();
}

function buildInitData(userId: string, authDate = nowSeconds) {
  return signInitData({
    auth_date: String(authDate),
    query_id: "test-query-id",
    user: JSON.stringify({
      id: userId,
      first_name: "Karma",
      username: "karma_admin"
    })
  });
}

describe("Telegram initData validation", () => {
  it("accepts correctly signed fresh initData", () => {
    const result = validateTelegramInitData(buildInitData(adminId), {
      botToken,
      nowSeconds,
      maxAgeSeconds: 3600
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.user.id).toBe(adminId);
  });

  it("rejects a changed user id", () => {
    const params = new URLSearchParams(buildInitData(adminId));
    params.set(
      "user",
      JSON.stringify({
        id: regularUserId,
        first_name: "Karma",
        username: "karma_admin"
      })
    );

    const result = validateTelegramInitData(params.toString(), {
      botToken,
      nowSeconds,
      maxAgeSeconds: 3600
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe("invalid_signature");
  });

  it("rejects an invalid hash", () => {
    const params = new URLSearchParams(buildInitData(adminId));
    params.set("hash", "0".repeat(64));

    const result = validateTelegramInitData(params.toString(), {
      botToken,
      nowSeconds,
      maxAgeSeconds: 3600
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe("invalid_signature");
  });

  it("rejects expired auth_date", () => {
    const result = validateTelegramInitData(buildInitData(adminId, nowSeconds - 3601), {
      botToken,
      nowSeconds,
      maxAgeSeconds: 3600
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe("expired");
  });

  it("does not grant admin access to a valid non-admin user", () => {
    const result = authorizeTelegramAdmin(buildInitData(regularUserId), {
      botToken,
      adminIds: adminId,
      nowSeconds,
      maxAgeSeconds: 3600
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.isAdmin).toBe(false);
    expect(result.ok && !result.isAdmin && result.reason).toBe("not_admin");
  });

  it("grants admin access to a valid configured admin user", () => {
    const result = authorizeTelegramAdmin(buildInitData(adminId), {
      botToken,
      adminIds: `${regularUserId}, ${adminId}`,
      nowSeconds,
      maxAgeSeconds: 3600
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.isAdmin).toBe(true);
  });
});
