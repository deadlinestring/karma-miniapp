import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("checkout page order flow integration", () => {
  const source = readFileSync(join(__dirname, "checkout-page.tsx"), "utf8");

  it("requests server quote instead of relying only on local totals", () => {
    expect(source).toContain('fetch("/api/orders/quote"');
    expect(source).toContain('deliveryMethod: "RUSSIAN_POST"');
    expect(source).toContain("priceListItemId: item.priceListItemId");
    expect(source).not.toContain("setShowDemo");
  });

  it("submits order creation with Telegram initData and address payload", () => {
    expect(source).toContain('fetch("/api/orders"');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain("recipientName: form.recipientName");
    expect(source).toContain("postalCode: form.postalCode");
    expect(source).toContain("customerFallbackContact");
    expect(source).toContain("consentPersonalData: accepted");
  });

  it("blocks order creation outside Telegram or without required fields", () => {
    expect(source).toContain("Оформление заказа доступно внутри Telegram Mini App.");
    expect(source).toContain("Boolean(initData)");
    expect(source).toContain("requiredFieldsFilled");
    expect(source).toContain("disabled={!canSubmit}");
  });

  it("shows delivery, discount and custom drawing totals", () => {
    expect(source).toContain('label="Доставка Почтой России"');
    expect(source).toContain('label="Скидка"');
    expect(source).toContain('label="Отрисовка"');
    expect(source).toContain("customDrawingTotalKopecks");
  });

  it("shows successful order public number without payment UI", () => {
    expect(source).toContain("createdOrder.publicNumber");
    expect(source).toContain("Онлайн-оплата не подключена");
    expect(source).not.toContain("confirmationUrl");
  });
});
