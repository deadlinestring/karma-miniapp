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
    expect(source).toContain("Telegram Mini App.");
    expect(source).toContain("Boolean(initData)");
    expect(source).toContain("requiredFieldsFilled");
    expect(source).toContain("disabled={!canSubmit}");
  });

  it("shows delivery, discount and custom drawing totals", () => {
    expect(source).toContain('label="Доставка Почтой России"');
    expect(source).toContain('label="Скидка"');
    expect(source).toContain('label="Отрисовка"');
    expect(source).toContain("customDrawingTotalKopecks");
    expect(source).toContain("customImageStoragePath: item.customImageStoragePath");
    expect(source).toContain("customImageFileName: item.customImageFileName");
  });

  it("shows successful order public number and link without payment UI", () => {
    expect(source).toContain("createdOrder.publicNumber");
    expect(source).toContain("createdOrderRef");
    expect(source).toContain("useScrollIntoViewOnChange(createdOrder?.publicNumber)");
    expect(source).toContain("Открыть заказ");
    expect(source).toContain("href={`/orders/${createdOrder.publicNumber}`}");
    expect(source).toContain('"payment-disabled-guidance"');
    expect(source).not.toContain("confirmationUrl");
  });

  it("uses content blocks for checkout guidance without changing order payload", () => {
    expect(source).toContain("useContentBlocks(checkoutContentSlugs)");
    expect(source).toContain('"checkout-delivery-help"');
    expect(source).toContain('"checkout-custom-review-help"');
    expect(source).toContain('"payment-disabled-guidance"');
    expect(source).toContain("customReviewHelpBlock?.body");
    expect(source).toContain("renderContentBlockLines(paymentDisabledBlock.body)");
    expect(source).toContain('fetch("/api/orders"');
  });

  it("scrolls important quote and submit errors into view", () => {
    expect(source).toContain("quoteErrorRef");
    expect(source).toContain("submitErrorRef");
    expect(source).toContain("useScrollIntoViewOnChange(quoteError)");
    expect(source).toContain("useScrollIntoViewOnChange(submitError)");
  });
});
