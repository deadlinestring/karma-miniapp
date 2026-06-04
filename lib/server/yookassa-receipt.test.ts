import { describe, expect, it } from "vitest";
import { buildYooKassaReceipt } from "./yookassa-receipt";

const regularOrder = {
  publicNumber: "KRM-20260602-8E3EBA",
  customerPhone: "+7 (900) 000-00-00",
  customerContact: null,
  deliveryKopecks: 55000,
  totalKopecks: 554000,
  items: [
    {
      productNameSnapshot: "Монки Д. Луффи",
      itemTypeLabelSnapshot: "Настенная панель",
      itemTypeSnapshot: "WALL_PANEL",
      sizeCmSnapshot: 30,
      unitPriceKopecks: 499000,
      baseSubtotalKopecks: 499000,
      discountKopecks: 0,
      quantity: 1,
      customDrawingSurchargeKopecks: 0
    }
  ]
};

describe("YooKassa receipt builder", () => {
  it("builds receipt for a regular order with delivery", () => {
    const receipt = buildYooKassaReceipt(regularOrder, 1);

    expect(receipt.customer).toEqual({ phone: "+79000000000" });
    expect(receipt.items).toHaveLength(2);
    expect(receipt.items[0]).toMatchObject({
      description: "Монки Д. Луффи, Настенная панель, 30 см",
      quantity: "1.00",
      amount: { value: "4990.00", currency: "RUB" },
      vat_code: 1,
      payment_subject: "commodity",
      payment_mode: "full_prepayment",
      measure: "piece"
    });
    expect(receipt.items[1]).toMatchObject({
      description: "Доставка Почтой России",
      amount: { value: "550.00" },
      payment_subject: "service"
    });
    expect(receiptTotal(receipt)).toBe(regularOrder.totalKopecks);
  });

  it("builds custom order receipt with drawing surcharge as service", () => {
    const receipt = buildYooKassaReceipt(
      {
        ...regularOrder,
        deliveryKopecks: 45000,
        totalKopecks: 693000,
        items: [
          {
            ...regularOrder.items[0],
            itemTypeLabelSnapshot: "Премиум",
            itemTypeSnapshot: "PREMIUM",
            unitPriceKopecks: 549000,
            baseSubtotalKopecks: 549000,
            customDrawingSurchargeKopecks: 99000
          }
        ]
      },
      2
    );

    expect(receipt.items).toHaveLength(3);
    expect(receipt.items[0].vat_code).toBe(2);
    expect(receipt.items[1]).toMatchObject({
      description: "Отрисовка своего дизайна",
      amount: { value: "990.00" },
      payment_subject: "service"
    });
    expect(receiptTotal(receipt)).toBe(693000);
  });

  it("allocates discount into commodity items without negative receipt lines", () => {
    const receipt = buildYooKassaReceipt(
      {
        ...regularOrder,
        deliveryKopecks: 55000,
        totalKopecks: 1338300,
        items: [
          {
            ...regularOrder.items[0],
            productNameSnapshot: "Premium 30",
            itemTypeLabelSnapshot: "Премиум",
            itemTypeSnapshot: "PREMIUM",
            sizeCmSnapshot: 30,
            unitPriceKopecks: 549000,
            baseSubtotalKopecks: 549000,
            discountKopecks: 164700
          },
          {
            ...regularOrder.items[0],
            productNameSnapshot: "Wall panel 55",
            sizeCmSnapshot: 55,
            unitPriceKopecks: 899000,
            baseSubtotalKopecks: 899000,
            discountKopecks: 0
          }
        ]
      },
      1
    );

    expect(receipt.items.some((item) => item.amount.value.startsWith("-"))).toBe(false);
    expect(receipt.items[0].amount.value).toBe("3843.00");
    expect(receiptTotal(receipt)).toBe(1338300);
  });

  it("splits non-divisible line discount across unit receipt items", () => {
    const receipt = buildYooKassaReceipt(
      {
        ...regularOrder,
        deliveryKopecks: 0,
        totalKopecks: 197,
        items: [
          {
            ...regularOrder.items[0],
            unitPriceKopecks: 100,
            baseSubtotalKopecks: 200,
            discountKopecks: 3,
            quantity: 2
          }
        ]
      },
      1
    );

    expect(receipt.items.map((item) => item.amount.value)).toEqual(["0.98", "0.99"]);
    expect(receiptTotal(receipt)).toBe(197);
  });

  it("requires receipt customer phone or email before provider call", () => {
    expect(() =>
      buildYooKassaReceipt({ ...regularOrder, customerPhone: "", customerContact: "" }, 1)
    ).toThrow("yookassa_receipt_customer_missing");

    expect(
      buildYooKassaReceipt({ ...regularOrder, customerPhone: "", customerContact: "buyer@example.test" }, 1).customer
    ).toEqual({ email: "buyer@example.test" });
  });

  it("sanitizes long descriptions and rejects receipt total mismatch", () => {
    const receipt = buildYooKassaReceipt(
      {
        ...regularOrder,
        items: [{ ...regularOrder.items[0], productNameSnapshot: `<script>${"x".repeat(180)}` }]
      },
      1
    );

    expect(receipt.items[0].description).not.toContain("<script>");
    expect(receipt.items[0].description.length).toBeLessThanOrEqual(128);
    expect(() => buildYooKassaReceipt({ ...regularOrder, totalKopecks: 1 }, 1)).toThrow(
      "yookassa_receipt_total_mismatch"
    );
  });
});

function receiptTotal(receipt: ReturnType<typeof buildYooKassaReceipt>) {
  return receipt.items.reduce((sum, item) => sum + Number(item.amount.value.replace(".", "")), 0);
}
