import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin orders panel", () => {
  const source = readFileSync(join(__dirname, "admin-orders-panel.tsx"), "utf8");

  it("renders order list and detail controls", () => {
    expect(source).toContain("Заказы");
    expect(source).toContain("Поиск по номеру заказа");
    expect(source).toContain("Открыть");
    expect(source).toContain("К списку заказов");
    expect(source).toContain("Состав");
  });

  it("shows totals, items and statuses in detail", () => {
    expect(source).toContain("Товары");
    expect(source).toContain("Отрисовка");
    expect(source).toContain("Скидка");
    expect(source).toContain("Доставка");
    expect(source).toContain("Оплата:");
    expect(source).toContain("notificationSummary");
  });

  it("updates only fulfillment status through authenticated endpoint", () => {
    expect(source).toContain('fetch(`/api/admin/orders/${publicNumber}/status`');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain("JSON.stringify({ fulfillmentStatus })");
    expect(source).not.toContain("JSON.stringify({ fulfillmentStatus, paymentStatus");
  });

  it("scrolls success and error messages into view", () => {
    expect(source).toContain("useScrollIntoViewOnChange(message ?? error)");
    expect(source).toContain("statusRef");
    expect(source).toContain("Статус заказа обновлён.");
  });
});
