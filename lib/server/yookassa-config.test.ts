import { describe, expect, it } from "vitest";
import {
  getYooKassaConfig,
  isYooKassaConfigAvailable,
  isYooKassaPaymentsEnabled
} from "./yookassa-config";

describe("YooKassa config foundation", () => {
  it("detects missing provider env without exposing secrets", () => {
    expect(isYooKassaConfigAvailable({})).toBe(false);
    expect(() => getYooKassaConfig({})).toThrow("yookassa_shop_id_missing");
  });

  it("reads server-only env names", () => {
    const config = getYooKassaConfig({
      YOOKASSA_SHOP_ID: "shop",
      YOOKASSA_SECRET_KEY: "secret",
      YOOKASSA_RETURN_URL: "https://example.test/return",
      YOOKASSA_WEBHOOK_SECRET: "webhook"
    });

    expect(config).toEqual({
      shopId: "shop",
      secretKey: "secret",
      returnUrl: "https://example.test/return",
      webhookSecret: "webhook"
    });
    expect(isYooKassaConfigAvailable({
      YOOKASSA_PAYMENTS_ENABLED: "true",
      YOOKASSA_SHOP_ID: "shop",
      YOOKASSA_SECRET_KEY: "secret",
      YOOKASSA_RETURN_URL: "https://example.test/return"
    })).toBe(true);
  });

  it("keeps payments disabled unless the explicit feature flag is true", () => {
    const envWithKeys = {
      YOOKASSA_SHOP_ID: "shop",
      YOOKASSA_SECRET_KEY: "secret",
      YOOKASSA_RETURN_URL: "https://example.test/return"
    };

    expect(isYooKassaPaymentsEnabled(envWithKeys)).toBe(false);
    expect(isYooKassaPaymentsEnabled({ ...envWithKeys, YOOKASSA_PAYMENTS_ENABLED: "false" })).toBe(false);
    expect(isYooKassaPaymentsEnabled({ ...envWithKeys, YOOKASSA_PAYMENTS_ENABLED: "TRUE" })).toBe(false);
    expect(isYooKassaPaymentsEnabled({ ...envWithKeys, YOOKASSA_PAYMENTS_ENABLED: "true" })).toBe(true);
  });
});
