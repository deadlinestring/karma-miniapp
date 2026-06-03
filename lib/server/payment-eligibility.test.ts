import { describe, expect, it, vi } from "vitest";
import {
  evaluatePaymentEligibility,
  getCustomerOrderPaymentEligibilityWithServices
} from "./payment-eligibility";

const baseOrder = {
  paymentStatus: "PENDING" as const,
  fulfillmentStatus: "NEW" as const,
  totalKopecks: 100000,
  items: [{ customImageReviewStatus: "NOT_REQUIRED" as const }]
};

describe("payment eligibility", () => {
  it("allows regular pending orders with positive total", () => {
    expect(evaluatePaymentEligibility(baseOrder)).toMatchObject({
      eligible: true,
      reason: "ELIGIBLE"
    });
  });

  it("blocks custom orders while image review is pending", () => {
    expect(
      evaluatePaymentEligibility({
        ...baseOrder,
        items: [{ customImageReviewStatus: "PENDING_REVIEW" }]
      })
    ).toMatchObject({
      eligible: false,
      reason: "CUSTOM_IMAGE_PENDING_REVIEW"
    });
  });

  it("allows custom orders after all custom images are approved", () => {
    expect(
      evaluatePaymentEligibility({
        ...baseOrder,
        items: [{ customImageReviewStatus: "APPROVED" }]
      })
    ).toMatchObject({
      eligible: true,
      reason: "ELIGIBLE"
    });
  });

  it("blocks rejected custom images", () => {
    expect(
      evaluatePaymentEligibility({
        ...baseOrder,
        items: [{ customImageReviewStatus: "REJECTED" }]
      })
    ).toMatchObject({
      eligible: false,
      reason: "CUSTOM_IMAGE_REJECTED"
    });
  });

  it("blocks paid, cancelled and invalid amount orders", () => {
    expect(evaluatePaymentEligibility({ ...baseOrder, paymentStatus: "PAID" })).toMatchObject({
      eligible: false,
      reason: "PAYMENT_NOT_PENDING"
    });
    expect(evaluatePaymentEligibility({ ...baseOrder, fulfillmentStatus: "CANCELLED" })).toMatchObject({
      eligible: false,
      reason: "ORDER_FINAL"
    });
    expect(evaluatePaymentEligibility({ ...baseOrder, totalKopecks: 0 })).toMatchObject({
      eligible: false,
      reason: "INVALID_AMOUNT"
    });
  });

  it("scopes customer payment checks by Telegram user relation", async () => {
    const db = {
      order: {
        findFirst: vi.fn().mockResolvedValue(baseOrder)
      }
    };

    await getCustomerOrderPaymentEligibilityWithServices(
      "KRM-20260602-8E3EBA",
      { id: "12345" },
      { db: db as any }
    );

    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publicNumber: "KRM-20260602-8E3EBA",
          user: { telegramId: BigInt("12345") }
        }
      })
    );
  });
});
