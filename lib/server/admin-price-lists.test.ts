import { describe, expect, it, vi } from "vitest";
import {
  getAdminMainPriceListWithServices,
  updateAdminMainPriceListWithServices,
  validatePriceListUpdate,
  type AdminPriceListServices
} from "./admin-price-lists";

const items = [
  {
    id: "standard-20",
    priceListId: "main",
    itemType: "STANDARD",
    sizeCm: 20,
    priceKopecks: 249000,
    note: null,
    sortOrder: 10,
    isActive: true
  },
  {
    id: "wall-55",
    priceListId: "main",
    itemType: "WALL_PANEL",
    sizeCm: 55,
    priceKopecks: 899000,
    note: "Двойная подсветка сверху и снизу",
    sortOrder: 100,
    isActive: true
  }
] as const;

function makeServices() {
  const updates: unknown[] = [];
  const priceList = {
    id: "main",
    name: "Основной прайс KARMA",
    slug: "main",
    isActive: true,
    items
  };
  const tx = {
    priceListItem: {
      update: vi.fn().mockImplementation((args) => {
        updates.push(args);
        return Promise.resolve(args.data);
      })
    }
  };
  const db = {
    priceList: {
      findUnique: vi.fn().mockResolvedValue(priceList)
    },
    $transaction: vi.fn().mockImplementation((callback) => callback(tx))
  } as unknown as AdminPriceListServices["db"];

  return { services: { db } satisfies AdminPriceListServices, tx, updates };
}

describe("admin price lists repository", () => {
  it("returns a safe main price list DTO", async () => {
    const { services } = makeServices();
    const priceList = await getAdminMainPriceListWithServices(services);

    expect(priceList).toEqual(
      expect.objectContaining({
        id: "main",
        name: "Основной прайс KARMA",
        items: [
          expect.objectContaining({
            id: "standard-20",
            itemType: "STANDARD",
            itemTypeLabel: "Стандарт",
            priceRubles: 2490
          }),
          expect.objectContaining({
            id: "wall-55",
            itemType: "WALL_PANEL",
            itemTypeLabel: "Настенная панель",
            note: "Двойная подсветка сверху и снизу"
          })
        ]
      })
    );
  });

  it("rejects unknown item ids", () => {
    expect(() =>
      validatePriceListUpdate({ items: [{ id: "missing", priceRubles: 2490, note: null }] }, [...items])
    ).toThrow("unknown_price_list_item");
  });

  it("rejects attempts to change fixed matrix fields", () => {
    expect(() =>
      validatePriceListUpdate(
        { items: [{ id: "standard-20", priceRubles: 2490, itemType: "PREMIUM", note: null }] },
        [...items]
      )
    ).toThrow("forbidden_price_list_field");
  });

  it.each([0, -1, 10.5, 100001])("rejects invalid price %s", (priceRubles) => {
    expect(() =>
      validatePriceListUpdate({ items: [{ id: "standard-20", priceRubles, note: null }] }, [...items])
    ).toThrow("invalid_price");
  });

  it("trims note and limits note length", () => {
    expect(validatePriceListUpdate({ items: [{ id: "wall-55", priceRubles: 8990, note: "  note  " }] }, [...items])).toEqual([
      { id: "wall-55", priceRubles: 8990, note: "note" }
    ]);

    expect(() =>
      validatePriceListUpdate({ items: [{ id: "wall-55", priceRubles: 8990, note: "x".repeat(161) }] }, [...items])
    ).toThrow("invalid_note");
  });

  it("updates prices in kopecks through a transaction", async () => {
    const { services, tx } = makeServices();

    await updateAdminMainPriceListWithServices(
      { items: [{ id: "standard-20", priceRubles: 2500, note: null }] },
      services
    );

    expect(services.db.$transaction).toHaveBeenCalled();
    expect(tx.priceListItem.update).toHaveBeenCalledWith({
      where: { id: "standard-20" },
      data: { priceKopecks: 250000, note: null }
    });
  });
});
