import "server-only";

export type YooKassaConfig = {
  shopId: string;
  secretKey: string;
  returnUrl: string;
  webhookSecret: string | null;
  vatCode: number;
};

export function getYooKassaConfig(env: NodeJS.ProcessEnv = process.env): YooKassaConfig {
  const shopId = readRequiredEnv(env.YOOKASSA_SHOP_ID, "yookassa_shop_id_missing");
  const secretKey = readRequiredEnv(env.YOOKASSA_SECRET_KEY, "yookassa_secret_key_missing");
  const returnUrl = readRequiredEnv(env.YOOKASSA_RETURN_URL, "yookassa_return_url_missing");

  return {
    shopId,
    secretKey,
    returnUrl,
    webhookSecret: readOptionalEnv(env.YOOKASSA_WEBHOOK_SECRET),
    vatCode: readVatCode(env.YOOKASSA_VAT_CODE)
  };
}

export function isYooKassaConfigAvailable(env: NodeJS.ProcessEnv = process.env) {
  return isYooKassaPaymentsEnabled(env);
}

export function isYooKassaPaymentsEnabled(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(
    readOptionalEnv(env.YOOKASSA_PAYMENTS_ENABLED) === "true" &&
      readOptionalEnv(env.YOOKASSA_SHOP_ID) &&
      readOptionalEnv(env.YOOKASSA_SECRET_KEY) &&
      readOptionalEnv(env.YOOKASSA_RETURN_URL)
  );
}

export function getYooKassaWebhookSecret(env: NodeJS.ProcessEnv = process.env) {
  return readRequiredEnv(env.YOOKASSA_WEBHOOK_SECRET, "yookassa_webhook_secret_missing");
}

function readRequiredEnv(value: string | undefined, errorCode: string) {
  const trimmed = readOptionalEnv(value);

  if (!trimmed) {
    throw new Error(errorCode);
  }

  return trimmed;
}

function readOptionalEnv(value: string | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

function readVatCode(value: string | undefined) {
  const raw = readOptionalEnv(value) ?? "1";
  const code = Number(raw);

  if (!Number.isInteger(code) || code < 1 || code > 6) {
    throw new Error("yookassa_vat_code_invalid");
  }

  return code;
}
