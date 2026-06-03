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
    expect(source).toContain("Напишите нам по заказу");
    expect(source).toContain("Менеджер ответит в Telegram");
  });

  it("renders a clickable support bot link with safe order context", () => {
    expect(source).toContain("karmashopsupportbot");
    expect(source).toContain("https://t.me/${SUPPORT_BOT_USERNAME}?start=order_");
    expect(source).toContain("buildSupportTelegramUrl(order.publicNumber)");
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noreferrer"');
    expect(source).toContain("openTelegramLink(supportUrl)");
    expect(source).toContain('publicNumber.replace(/-/g, "_")');
  });

  it("documents the expected Telegram support deep link conversion", () => {
    const safeOrderNumber = "KRM-20260601-805754".replace(/-/g, "_");

    expect(`https://t.me/karmashopsupportbot?start=order_${safeOrderNumber}`).toBe(
      "https://t.me/karmashopsupportbot?start=order_KRM_20260601_805754"
    );
  });

  it("does not expose bot secrets or admin identifiers in customer markup", () => {
    expect(source).not.toContain("TELEGRAM_BOT_TOKEN");
    expect(source).not.toContain("ADMIN_TELEGRAM_IDS");
    expect(source).not.toContain("DATABASE_URL");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE");
  });

  it("shows payment foundation messages without an active YooKassa button", () => {
    expect(source).toContain("getPaymentNotice(order)");
    expect(source).toContain("Оплата заказа");
    expect(source).toContain("Оплата скоро");
    expect(source).toContain("Изображение проверяется администратором. Оплата будет доступна после проверки.");
    expect(source).toContain("Изображение одобрено. Онлайн-оплата будет подключена следующим этапом.");
    expect(source).toContain("Онлайн-оплата скоро появится. Сейчас менеджер подтвердит заказ");
    expect(source).not.toContain("confirmationUrl");
    expect(source).not.toContain("yookassa");
  });
});
