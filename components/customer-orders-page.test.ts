import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("customer orders page", () => {
  const source = readFileSync(join(__dirname, "customer-orders-page.tsx"), "utf8");

  it("loads orders only with Telegram initData kept in memory", () => {
    expect(source).toContain("window.Telegram?.WebApp?.initData");
    expect(source).toContain('fetch("/api/orders"');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).not.toContain("localStorage");
  });

  it("shows outside Telegram and empty states", () => {
    expect(source).toContain("Заказы доступны внутри Telegram Mini App.");
    expect(source).toContain("У вас пока нет заказов.");
  });

  it("links order cards to the detail route", () => {
    expect(source).toContain("Мои заказы");
    expect(source).toContain("Здесь видны только заказы текущего Telegram-аккаунта");
    expect(source).toContain("href={`/orders/${order.publicNumber}`}");
    expect(source).toContain("Открыть");
  });
});
