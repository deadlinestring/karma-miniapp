import "server-only";

import { prisma } from "@/lib/server/prisma";

export type AdminStoreSettings = {
  storeName: string;
  subtitle: string | null;
  heroTitle: string;
  heroSubtitle: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  contactText: string | null;
  deliveryText: string | null;
};

type TextSettingsInput = {
  storeName?: unknown;
  subtitle?: unknown;
  heroTitle?: unknown;
  heroSubtitle?: unknown;
  contactText?: unknown;
  deliveryText?: unknown;
};

const fieldLimits = {
  storeName: 80,
  subtitle: 120,
  heroTitle: 140,
  heroSubtitle: 220,
  contactText: 500,
  deliveryText: 500
};

const defaultSettings: AdminStoreSettings = {
  storeName: "KARMA",
  subtitle: "кастомные светильники",
  heroTitle: "Ночник, который сделает комнату твоей",
  heroSubtitle: "Выбери любимого персонажа, автомобиль или создай свой дизайн",
  logoUrl: null,
  heroImageUrl: null,
  contactText: null,
  deliveryText: null
};

export function mapAdminStoreSettings(settings: AdminStoreSettings): AdminStoreSettings {
  return {
    storeName: settings.storeName,
    subtitle: settings.subtitle,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    logoUrl: settings.logoUrl,
    heroImageUrl: settings.heroImageUrl,
    contactText: settings.contactText,
    deliveryText: settings.deliveryText
  };
}

export async function getAdminStoreSettings() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "main" }
  });

  return settings ? mapAdminStoreSettings(settings) : defaultSettings;
}

export async function updateAdminStoreSettings(input: TextSettingsInput) {
  const data = validateSettingsTextInput(input);
  const settings = await prisma.storeSettings.update({
    where: { id: "main" },
    data
  });

  return mapAdminStoreSettings(settings);
}

export async function updateAdminSettingsImage(kind: "logo" | "hero", publicUrl: string) {
  const settings = await prisma.storeSettings.update({
    where: { id: "main" },
    data: kind === "logo" ? { logoUrl: publicUrl } : { heroImageUrl: publicUrl }
  });

  return mapAdminStoreSettings(settings);
}

export function validateSettingsTextInput(input: TextSettingsInput) {
  const storeName = readRequiredString(input.storeName, fieldLimits.storeName);
  const heroTitle = readRequiredString(input.heroTitle, fieldLimits.heroTitle);
  const heroSubtitle = readRequiredString(input.heroSubtitle, fieldLimits.heroSubtitle);

  return {
    storeName,
    heroTitle,
    heroSubtitle,
    subtitle: readOptionalString(input.subtitle, fieldLimits.subtitle),
    contactText: readOptionalString(input.contactText, fieldLimits.contactText),
    deliveryText: readOptionalString(input.deliveryText, fieldLimits.deliveryText)
  };
}

function readRequiredString(value: unknown, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text || text.length > maxLength) {
    throw new Error("invalid_settings_payload");
  }

  return text;
}

function readOptionalString(value: unknown, maxLength: number) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("invalid_settings_payload");
  }

  const text = value.trim();

  if (text.length > maxLength) {
    throw new Error("invalid_settings_payload");
  }

  return text || null;
}
