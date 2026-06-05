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
    expect(source).toContain('"orders-empty-state"');
    expect(source).toContain("emptyBlock?.title");
  });

  it("links order cards to the detail route", () => {
    expect(source).toContain("Мои заказы");
    expect(source).toContain('"orders-intro-help"');
    expect(source).toContain("href={`/orders/${order.publicNumber}`}");
    expect(source).toContain("Открыть");
  });

  it("uses shared status badge for payment status display", () => {
    expect(source).toContain('import { StatusBadge }');
    expect(source).toContain("<StatusBadge>{order.paymentStatusLabel}</StatusBadge>");
  });

  it("renders intro and empty state content as plain text", () => {
    expect(source).toContain("renderContentBlockLines(introBlock.body)");
    expect(source).toContain("renderContentBlockLines(emptyBlock.body)");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
