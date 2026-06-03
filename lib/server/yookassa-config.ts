import "server-only";

export type YooKassaConfig = {
  shopId: string;
  secretKey: string;
  returnUrl: string;
  webhookSecret: string | null;
};

export function getYooKassaConfig(env: NodeJS.ProcessEnv = process.env): YooKassaConfig {
  const shopId = readRequiredEnv(env.YOOKASSA_SHOP_ID, "yookassa_shop_id_missing");
  const secretKey = readRequiredEnv(env.YOOKASSA_SECRET_KEY, "yookassa_secret_key_missing");
  const returnUrl = readRequiredEnv(env.YOOKASSA_RETURN_URL, "yookassa_return_url_missing");

  return {
    shopId,
    secretKey,
    returnUrl,
    webhookSecret: readOptionalEnv(env.YOOKASSA_WEBHOOK_SECRET)
  };
}

export function isYooKassaConfigAvailable(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(
    readOptionalEnv(env.YOOKASSA_SHOP_ID) &&
      readOptionalEnv(env.YOOKASSA_SECRET_KEY) &&
      readOptionalEnv(env.YOOKASSA_RETURN_URL)
  );
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
