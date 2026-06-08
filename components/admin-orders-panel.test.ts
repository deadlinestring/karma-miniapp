import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin orders panel", () => {
  const source = readFileSync(join(__dirname, "admin-orders-panel.tsx"), "utf8");

  it("renders order list and detail controls", () => {
    expect(source).toContain("AdminOrdersPanel");
    expect(source).toContain("OrderListView");
    expect(source).toContain("OrderDetailView");
    expect(source).toContain("onUpdateStatus");
  });

  it("shows totals, items and statuses in detail", () => {
    expect(source).toContain("itemsSubtotalKopecks");
    expect(source).toContain("customDrawingKopecks");
    expect(source).toContain("discountAmountKopecks");
    expect(source).toContain("deliveryAmountKopecks");
    expect(source).toContain("paymentStatusLabel");
    expect(source).toContain("notificationSummary");
  });

  it("highlights paid orders without changing payment status manually", () => {
    expect(source).toContain('order.paymentStatus === "PAID"');
    expect(source).toContain("Оплата получена");
    expect(source).toContain("Платёж синхронизирован webhook");
    expect(source).toContain("Статус выполнения меняется отдельно вручную");
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
    expect(source).toContain("onMessage");
    expect(source).toContain("onError");
  });

  it("renders custom image review controls without exposing private storage paths", () => {
    expect(source).toContain("Изображение на проверку");
    expect(source).toContain("Посмотреть изображение");
    expect(source).toContain("Одобрить");
    expect(source).toContain("Отклонить");
    expect(source).toContain("customImageReviewStatus");
    expect(source).toContain("hasCustomImage");
    expect(source).toContain('import { ImageLightbox }');
    expect(source).toContain("setLightboxUrl(image.signedUrl)");
    expect(source).toContain("setLightboxUrl(customImageUrl)");
    expect(source).toContain("<ImageLightbox src={lightboxUrl}");
    expect(source).not.toContain("customImageStoragePath:");
  });

  it("uses protected endpoints for custom image preview and review", () => {
    expect(source).toContain('fetch(`/api/admin/orders/${publicNumber}/custom-image`');
    expect(source).toContain('fetch(`/api/admin/orders/${publicNumber}/custom-image-review`');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain("JSON.stringify(payload)");
  });
});
