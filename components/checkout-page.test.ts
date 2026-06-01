import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("checkout page server quote integration", () => {
  const source = readFileSync(join(__dirname, "checkout-page.tsx"), "utf8");

  it("requests server quote instead of relying only on local totals", () => {
    expect(source).toContain('fetch("/api/orders/quote"');
    expect(source).toContain('deliveryMethod: "RUSSIAN_POST"');
    expect(source).toContain("priceListItemId: item.priceListItemId");
    expect(source).not.toContain("setShowDemo");
  });

  it("shows delivery, discount and custom drawing totals", () => {
    expect(source).toContain('label="Доставка Почтой России"');
    expect(source).toContain('label="Скидка"');
    expect(source).toContain('label="Отрисовка"');
    expect(source).toContain("customDrawingTotalKopecks");
  });

  it("keeps order creation disabled for the next stage", () => {
    expect(source).toContain("Создание заказа будет подключено следующим этапом");
    expect(source).toContain("<ActionButton className=\"mt-4 w-full\" disabled>");
  });
});
