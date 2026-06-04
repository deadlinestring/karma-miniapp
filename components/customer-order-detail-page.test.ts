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

  it("shows active YooKassa redirect button only for eligible configured orders", () => {
    expect(source).toContain("paymentAction.providerEnabled && paymentAction.eligible");
    expect(source).toContain("Перейти к оплате");
    expect(source).toContain("Оплата скоро");
    expect(source).toContain("fetch(`/api/orders/${order.publicNumber}/payment/prepare`");
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain("body.payment.confirmationUrl");
  });

  it("renders a clear paid payment state instead of a disabled payment button", () => {
    expect(source).toContain('order?.paymentStatus === "PAID"');
    expect(source).toContain("Заказ оплачен");
    expect(source).toContain("Платёж получен");
    expect(source).toContain("isOrderPaid ? null : paymentAction.providerEnabled");
  });

  it("uses content blocks for payment disabled guidance and support CTA", () => {
    expect(source).toContain("useContentBlocks(orderContentSlugs)");
    expect(source).toContain('"payment-disabled-guidance"');
    expect(source).toContain('"support-cta"');
    expect(source).toContain('paymentAction.reason === "PROVIDER_DISABLED"');
    expect(source).toContain("renderContentBlockLines(paymentDisabledBlock.body)");
    expect(source).toContain("supportBlock.ctaLabel");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("opens confirmationUrl from the prepare response without hardcoding provider URLs", () => {
    expect(source).toContain("openPaymentUrl(body.payment.confirmationUrl)");
    expect(source).toContain("window.Telegram?.WebApp?.openLink");
    expect(source).toContain("window.location.assign(url)");
    expect(source).not.toContain("https://api.yookassa.ru");
    expect(source).not.toContain("YOOKASSA_SECRET_KEY");
  });
});
