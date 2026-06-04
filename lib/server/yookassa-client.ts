import "server-only";

import type { PaymentStatus } from "@prisma/client";
import type { YooKassaConfig } from "@/lib/server/yookassa-config";

const YOOKASSA_PAYMENTS_URL = "https://api.yookassa.ru/v3/payments";

export type CreateYooKassaPaymentInput = {
  publicNumber: string;
  amountKopecks: number;
  idempotencyKey: string;
};

export type CreateYooKassaPaymentResult = {
  providerPaymentId: string;
  status: PaymentStatus;
  providerStatus: string;
  confirmationUrl: string;
};

type FetchLike = typeof fetch;

type YooKassaPaymentResponse = {
  id?: unknown;
  status?: unknown;
  confirmation?: {
    confirmation_url?: unknown;
  };
};

export async function createYooKassaPayment(
  input: CreateYooKassaPaymentInput,
  config: YooKassaConfig,
  fetchImpl: FetchLike = fetch
): Promise<CreateYooKassaPaymentResult> {
  const response = await fetchImpl(YOOKASSA_PAYMENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.shopId}:${config.secretKey}`, "utf8").toString("base64")}`,
      "Content-Type": "application/json",
      "Idempotence-Key": input.idempotencyKey
    },
    body: JSON.stringify({
      amount: {
        value: formatKopecksForYooKassa(input.amountKopecks),
        currency: "RUB"
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: buildReturnUrl(config.returnUrl, input.publicNumber)
      },
      description: `Заказ ${input.publicNumber}`,
      metadata: {
        orderPublicNumber: input.publicNumber
      },
      save_payment_method: false
    })
  });

  const body = (await readJsonSafely(response)) as YooKassaPaymentResponse | null;

  if (!response.ok) {
    throw new Error("yookassa_payment_create_failed");
  }

  const providerPaymentId = readNonEmptyString(body?.id);
  const providerStatus = readNonEmptyString(body?.status);
  const confirmationUrl = readNonEmptyString(body?.confirmation?.confirmation_url);

  if (!providerPaymentId || !providerStatus || !confirmationUrl) {
    throw new Error("yookassa_payment_response_invalid");
  }

  return {
    providerPaymentId,
    providerStatus,
    status: mapYooKassaStatus(providerStatus),
    confirmationUrl
  };
}

export function formatKopecksForYooKassa(amountKopecks: number) {
  if (!Number.isInteger(amountKopecks) || amountKopecks <= 0) {
    throw new Error("invalid_yookassa_amount");
  }

  return (amountKopecks / 100).toFixed(2);
}

export function buildReturnUrl(returnUrl: string, publicNumber: string) {
  const url = new URL(returnUrl);
  url.searchParams.set("order", publicNumber);
  return url.toString();
}

export function mapYooKassaStatus(status: string): PaymentStatus {
  if (status === "succeeded") {
    return "PAID";
  }

  if (status === "canceled") {
    return "CANCELLED";
  }

  return "PENDING";
}

async function readJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
