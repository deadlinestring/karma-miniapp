import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_MAX_AGE_SECONDS = 3600;
const FUTURE_AUTH_DATE_TOLERANCE_SECONDS = 60;

export type TelegramAuthUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export type TelegramValidationSuccess = {
  ok: true;
  user: TelegramAuthUser;
  authDate: number;
};

export type TelegramValidationFailure = {
  ok: false;
  reason:
    | "missing_init_data"
    | "missing_bot_token"
    | "missing_hash"
    | "invalid_signature"
    | "invalid_auth_date"
    | "expired"
    | "future_auth_date"
    | "invalid_user";
};

export type TelegramValidationResult = TelegramValidationSuccess | TelegramValidationFailure;

export type TelegramAdminAuthResult =
  | (TelegramValidationSuccess & { isAdmin: true })
  | (TelegramValidationSuccess & { isAdmin: false; reason: "not_admin" })
  | TelegramValidationFailure;

type TelegramAuthOptions = {
  botToken?: string;
  adminIds?: string;
  maxAgeSeconds?: number;
  nowSeconds?: number;
};

function getMaxAgeSeconds(value?: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  const envValue = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS);
  return Number.isFinite(envValue) && envValue > 0 ? envValue : DEFAULT_MAX_AGE_SECONDS;
}

function parseAdminIds(value?: string) {
  return new Set(
    (value ?? process.env.ADMIN_TELEGRAM_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function secureCompareHex(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function getTelegramUserIdString(userJson: string) {
  const match = userJson.match(/"id"\s*:\s*"?(\d+)"?/);
  return match?.[1] ?? null;
}

function parseTelegramUser(userJson: string): TelegramAuthUser | null {
  const id = getTelegramUserIdString(userJson);

  if (!id) {
    return null;
  }

  try {
    const parsed = JSON.parse(userJson) as {
      first_name?: unknown;
      last_name?: unknown;
      username?: unknown;
    };

    return {
      id,
      firstName: typeof parsed.first_name === "string" ? parsed.first_name : undefined,
      lastName: typeof parsed.last_name === "string" ? parsed.last_name : undefined,
      username: typeof parsed.username === "string" ? parsed.username : undefined
    };
  } catch {
    return null;
  }
}

export function validateTelegramInitData(
  rawInitData: string | null | undefined,
  options: TelegramAuthOptions = {}
): TelegramValidationResult {
  if (!rawInitData) {
    return { ok: false, reason: "missing_init_data" };
  }

  const botToken = options.botToken ?? process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { ok: false, reason: "missing_bot_token" };
  }

  const params = new URLSearchParams(rawInitData);
  const hash = params.get("hash");

  if (!hash) {
    return { ok: false, reason: "missing_hash" };
  }

  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!secureCompareHex(calculatedHash, hash)) {
    return { ok: false, reason: "invalid_signature" };
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : NaN;

  if (!Number.isInteger(authDate) || authDate <= 0) {
    return { ok: false, reason: "invalid_auth_date" };
  }

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (authDate > nowSeconds + FUTURE_AUTH_DATE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "future_auth_date" };
  }

  if (nowSeconds - authDate > getMaxAgeSeconds(options.maxAgeSeconds)) {
    return { ok: false, reason: "expired" };
  }

  const userJson = params.get("user");
  const user = userJson ? parseTelegramUser(userJson) : null;

  if (!user) {
    return { ok: false, reason: "invalid_user" };
  }

  return { ok: true, user, authDate };
}

export function authorizeTelegramAdmin(
  rawInitData: string | null | undefined,
  options: TelegramAuthOptions = {}
): TelegramAdminAuthResult {
  const validation = validateTelegramInitData(rawInitData, options);

  if (!validation.ok) {
    return validation;
  }

  const adminIds = parseAdminIds(options.adminIds);

  if (!adminIds.has(validation.user.id)) {
    return { ...validation, isAdmin: false, reason: "not_admin" };
  }

  return { ...validation, isAdmin: true };
}
