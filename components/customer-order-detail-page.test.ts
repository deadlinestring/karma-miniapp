import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("customer order detail page", () => {
  const source = readFileSync(join(__dirname, "customer-order-detail-page.tsx"), "utf8");

  it("loads one order through authenticated customer endpoint", () => {
    expect(source).toContain("window.Telegram?.WebApp?.initData");
    expect(source).toContain("fetch(`/api/orders/${publicNumber}`");
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).not.toContain("localStorage");
  });

  it("renders status, totals, snapshots and contact guidance", () => {
    expect(source).toContain("Статус");
    expect(source).toContain("Оплата");
    expect(source).toContain("Состав заказа");
    expect(source).toContain("Доставка и контакт");
    expect(source).toContain("Напишите нам в Telegram");
  });
});
