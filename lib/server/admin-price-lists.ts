import "server-only";

import { prisma } from "@/lib/server/prisma";
import type { StorefrontItemType } from "@/lib/storefront-types";

type PrismaLike = typeof prisma;

export type AdminPriceListItem = {
  id: string;
  itemType: StorefrontItemType;
  itemTypeLabel: string;
  sizeCm: number;
  priceKopecks: number;
  priceRubles: number;
  note: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AdminPriceList = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  items: AdminPriceListItem[];
};

export type AdminPriceListUpdateInput = {
  items?: unknown;
};

export type AdminPriceListServices = {
  db: PrismaLike;
};

const MAIN_PRICE_LIST_ID = "main";
const MAX_PRICE_RUBLES = 100_000;
const MAX_NOTE_LENGTH = 160;

const itemTypeLabels: Record<StorefrontItemType, string> = {
  STANDARD: "Стандарт",
  PREMIUM: "Премиум",
  WALL_PANEL: "Настенная панель"
};

const defaultServices: AdminPriceListServices = {
  db: prisma
};

type PriceListRecord = NonNullable<Awaited<ReturnType<typeof readMainPriceList>>>;
type PriceListItemRecord = PriceListRecord["items"][number];

export async function getAdminMainPriceList() {
  return getAdminMainPriceListWithServices(defaultServices);
}

export async function updateAdminMainPriceList(input: AdminPriceListUpdateInput) {
  return updateAdminMainPriceListWithServices(input, defaultServices);
}

export async function getAdminMainPriceListWithServices(services: AdminPriceListServices) {
  const priceList = await readMainPriceList(services.db);

  if (!priceList) {
    throw new Error("main_price_list_not_found");
  }

  return mapAdminPriceList(priceList);
}

export async function updateAdminMainPriceListWithServices(
  input: AdminPriceListUpdateInput,
  services: AdminPriceListServices
) {
  const current = await readMainPriceList(services.db);

  if (!current) {
    throw new Error("main_price_list_not_found");
  }

  const updates = validatePriceListUpdate(input, current.items);

  await services.db.$transaction(async (tx) => {
    for (const update of updates) {
      await tx.priceListItem.update({
        where: { id: update.id },
        data: {
          priceKopecks: update.priceRubles * 100,
          note: update.note
        }
      });
    }
  });

  return getAdminMainPriceListWithServices(services);
}

function readMainPriceList(db: PrismaLike) {
  return db.priceList.findUnique({
    where: { id: MAIN_PRICE_LIST_ID },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      items: {
        where: { isActive: true },
        orderBy: [
          { sortOrder: "asc" as const },
          { itemType: "asc" as const },
          { sizeCm: "asc" as const }
        ],
        select: {
          id: true,
          priceListId: true,
          itemType: true,
          sizeCm: true,
          priceKopecks: true,
          note: true,
          sortOrder: true,
          isActive: true
        }
      }
    }
  });
}

function mapAdminPriceList(priceList: PriceListRecord): AdminPriceList {
  return {
    id: priceList.id,
    name: priceList.name,
    slug: priceList.slug,
    isActive: priceList.isActive,
    items: priceList.items.map(mapAdminPriceListItem)
  };
}

function mapAdminPriceListItem(item: PriceListItemRecord): AdminPriceListItem {
  return {
    id: item.id,
    itemType: item.itemType,
    itemTypeLabel: itemTypeLabels[item.itemType],
    sizeCm: item.sizeCm,
    priceKopecks: item.priceKopecks,
    priceRubles: item.priceKopecks / 100,
    note: item.note,
    sortOrder: item.sortOrder,
    isActive: item.isActive
  };
}

export function validatePriceListUpdate(input: AdminPriceListUpdateInput, existingItems: PriceListItemRecord[]) {
  if (!input || typeof input !== "object" || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("invalid_price_list_payload");
  }

  const existingIds = new Set(existingItems.map((item) => item.id));
  const seenIds = new Set<string>();

  return input.items.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("invalid_price_list_payload");
    }

    const candidate = item as Record<string, unknown>;
    const allowedKeys = new Set(["id", "priceRubles", "note"]);

    if (Object.keys(candidate).some((key) => !allowedKeys.has(key))) {
      throw new Error("forbidden_price_list_field");
    }

    if (typeof candidate.id !== "string" || !existingIds.has(candidate.id) || seenIds.has(candidate.id)) {
      throw new Error("unknown_price_list_item");
    }

    seenIds.add(candidate.id);

    if (
      typeof candidate.priceRubles !== "number" ||
      !Number.isInteger(candidate.priceRubles) ||
      candidate.priceRubles <= 0 ||
      candidate.priceRubles > MAX_PRICE_RUBLES
    ) {
      throw new Error("invalid_price");
    }

    return {
      id: candidate.id,
      priceRubles: candidate.priceRubles,
      note: readNote(candidate.note)
    };
  });
}

function readNote(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("invalid_note");
  }

  const note = value.trim();

  if (note.length > MAX_NOTE_LENGTH) {
    throw new Error("invalid_note");
  }

  return note || null;
}
