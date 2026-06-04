import "server-only";

export type YooKassaReceipt = {
  customer: {
    phone?: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: string;
    amount: {
      value: string;
      currency: "RUB";
    };
    vat_code: number;
    payment_subject: "commodity" | "service";
    payment_mode: "full_prepayment";
    measure: "piece";
  }>;
};

export type YooKassaReceiptOrder = {
  publicNumber: string;
  customerPhone: string;
  customerContact: string | null;
  deliveryKopecks: number;
  totalKopecks: number;
  items: Array<{
    productNameSnapshot: string;
    itemTypeLabelSnapshot: string | null;
    itemTypeSnapshot: string;
    sizeCmSnapshot: number;
    unitPriceKopecks: number;
    baseSubtotalKopecks: number;
    discountKopecks: number;
    quantity: number;
    customDrawingSurchargeKopecks: number;
  }>;
};

export class YooKassaReceiptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YooKassaReceiptError";
  }
}

export function buildYooKassaReceipt(order: YooKassaReceiptOrder, vatCode: number): YooKassaReceipt {
  const customer = buildReceiptCustomer(order);
  const items: YooKassaReceipt["items"] = [];

  for (const orderItem of order.items) {
    const unitDiscounts = distributeLineDiscount(orderItem.discountKopecks, orderItem.quantity);

    for (let index = 0; index < orderItem.quantity; index += 1) {
      const unitAmount = orderItem.unitPriceKopecks - unitDiscounts[index];

      if (unitAmount <= 0) {
        throw new YooKassaReceiptError("yookassa_receipt_item_amount_invalid");
      }

      items.push({
        description: sanitizeReceiptDescription(
          `${orderItem.productNameSnapshot}, ${orderItem.itemTypeLabelSnapshot ?? orderItem.itemTypeSnapshot}, ${orderItem.sizeCmSnapshot} см`
        ),
        quantity: "1.00",
        amount: {
          value: formatReceiptKopecks(unitAmount),
          currency: "RUB"
        },
        vat_code: vatCode,
        payment_subject: "commodity",
        payment_mode: "full_prepayment",
        measure: "piece"
      });
    }

    if (orderItem.customDrawingSurchargeKopecks > 0) {
      items.push(buildServiceReceiptItem("Отрисовка своего дизайна", orderItem.customDrawingSurchargeKopecks, vatCode));
    }
  }

  if (order.deliveryKopecks > 0) {
    items.push(buildServiceReceiptItem("Доставка Почтой России", order.deliveryKopecks, vatCode));
  }

  const receiptTotal = items.reduce((sum, item) => sum + parseReceiptAmountKopecks(item.amount.value), 0);

  if (receiptTotal !== order.totalKopecks) {
    throw new YooKassaReceiptError("yookassa_receipt_total_mismatch");
  }

  return { customer, items };
}

export function formatReceiptKopecks(amountKopecks: number) {
  if (!Number.isInteger(amountKopecks) || amountKopecks <= 0) {
    throw new YooKassaReceiptError("yookassa_receipt_amount_invalid");
  }

  return (amountKopecks / 100).toFixed(2);
}

function buildReceiptCustomer(order: YooKassaReceiptOrder) {
  const phone = normalizeReceiptPhone(order.customerPhone) ?? normalizeReceiptPhone(order.customerContact);
  const email = extractEmail(order.customerContact);

  if (phone) {
    return { phone };
  }

  if (email) {
    return { email };
  }

  throw new YooKassaReceiptError("yookassa_receipt_customer_missing");
}

function buildServiceReceiptItem(description: string, amountKopecks: number, vatCode: number): YooKassaReceipt["items"][number] {
  return {
    description: sanitizeReceiptDescription(description),
    quantity: "1.00",
    amount: {
      value: formatReceiptKopecks(amountKopecks),
      currency: "RUB"
    },
    vat_code: vatCode,
    payment_subject: "service",
    payment_mode: "full_prepayment",
    measure: "piece"
  };
}

function distributeLineDiscount(discountKopecks: number, quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new YooKassaReceiptError("yookassa_receipt_quantity_invalid");
  }

  if (!Number.isInteger(discountKopecks) || discountKopecks < 0) {
    throw new YooKassaReceiptError("yookassa_receipt_discount_invalid");
  }

  const baseDiscount = Math.floor(discountKopecks / quantity);
  const remainder = discountKopecks % quantity;

  return Array.from({ length: quantity }, (_, index) => baseDiscount + (index < remainder ? 1 : 0));
}

function normalizeReceiptPhone(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

function extractEmail(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

function sanitizeReceiptDescription(value: string) {
  const sanitized = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return sanitized.slice(0, 128) || "Позиция заказа";
}

function parseReceiptAmountKopecks(value: string) {
  const [rubles, kopecks = "00"] = value.split(".");
  return Number(rubles) * 100 + Number(kopecks.padEnd(2, "0").slice(0, 2));
}
