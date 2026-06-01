export type OrderPricingItemType = "STANDARD" | "PREMIUM" | "WALL_PANEL";

export type CustomDrawingStyle =
  | "CUSTOM_DRAWING_STYLE_1"
  | "CUSTOM_DRAWING_STYLE_2"
  | "CUSTOM_DRAWING_STYLE_3";

export type OrderPricingInputItem = {
  lineId?: string;
  itemType: OrderPricingItemType;
  unitPriceKopecks: number;
  quantity: number;
  customDrawingStyle?: CustomDrawingStyle | null;
  customDesignKey?: string | null;
};

export type OrderPricingLine = OrderPricingInputItem & {
  baseSubtotalKopecks: number;
  customDrawingSurchargeKopecks: number;
  discountKopecks: number;
  lineTotalKopecks: number;
};

export type OrderPricingResult = {
  lines: OrderPricingLine[];
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  deliveryKopecks: number;
  discountKopecks: number;
  totalKopecks: number;
};

export const CUSTOM_DRAWING_SURCHARGE_KOPECKS: Record<CustomDrawingStyle, number> = {
  CUSTOM_DRAWING_STYLE_1: 69000,
  CUSTOM_DRAWING_STYLE_2: 79000,
  CUSTOM_DRAWING_STYLE_3: 99000
};

export const NIGHTLIGHT_DELIVERY_KOPECKS = 45000;
export const WALL_PANEL_DELIVERY_KOPECKS = 55000;
export const SECOND_PHYSICAL_ITEM_DISCOUNT_PERCENT = 30;

const PHYSICAL_ITEM_TYPES = new Set<OrderPricingItemType>([
  "STANDARD",
  "PREMIUM",
  "WALL_PANEL"
]);

export function calculateOrderPricing(items: OrderPricingInputItem[]): OrderPricingResult {
  if (items.length === 0) {
    return {
      lines: [],
      itemsSubtotalKopecks: 0,
      customDrawingKopecks: 0,
      deliveryKopecks: 0,
      discountKopecks: 0,
      totalKopecks: 0
    };
  }

  const surchargeByLine = calculateCustomDrawingSurcharges(items);
  const discountByLine = calculateSecondPhysicalItemDiscounts(items);

  const lines = items.map<OrderPricingLine>((item, index) => {
    validatePricingItem(item);

    const baseSubtotalKopecks = item.unitPriceKopecks * item.quantity;
    const customDrawingSurchargeKopecks = surchargeByLine.get(index) ?? 0;
    const discountKopecks = discountByLine.get(index) ?? 0;

    return {
      ...item,
      baseSubtotalKopecks,
      customDrawingSurchargeKopecks,
      discountKopecks,
      lineTotalKopecks: baseSubtotalKopecks + customDrawingSurchargeKopecks - discountKopecks
    };
  });

  const itemsSubtotalKopecks = lines.reduce((sum, line) => sum + line.baseSubtotalKopecks, 0);
  const customDrawingKopecks = lines.reduce(
    (sum, line) => sum + line.customDrawingSurchargeKopecks,
    0
  );
  const discountKopecks = lines.reduce((sum, line) => sum + line.discountKopecks, 0);
  const deliveryKopecks = calculateDeliveryKopecks(items);

  return {
    lines,
    itemsSubtotalKopecks,
    customDrawingKopecks,
    deliveryKopecks,
    discountKopecks,
    totalKopecks:
      itemsSubtotalKopecks + customDrawingKopecks + deliveryKopecks - discountKopecks
  };
}

export function calculateDeliveryKopecks(items: Pick<OrderPricingInputItem, "itemType">[]) {
  if (items.length === 0) {
    return 0;
  }

  return items.some((item) => item.itemType === "WALL_PANEL")
    ? WALL_PANEL_DELIVERY_KOPECKS
    : NIGHTLIGHT_DELIVERY_KOPECKS;
}

function calculateCustomDrawingSurcharges(items: OrderPricingInputItem[]) {
  const chargedDesigns = new Set<string>();
  const surchargeByLine = new Map<number, number>();

  items.forEach((item, index) => {
    validatePricingItem(item);

    if (!item.customDrawingStyle) {
      return;
    }

    const designKey = item.customDesignKey?.trim() || `line:${index}`;

    if (chargedDesigns.has(designKey)) {
      return;
    }

    chargedDesigns.add(designKey);
    surchargeByLine.set(index, CUSTOM_DRAWING_SURCHARGE_KOPECKS[item.customDrawingStyle]);
  });

  return surchargeByLine;
}

function calculateSecondPhysicalItemDiscounts(items: OrderPricingInputItem[]) {
  const eligibleUnits: Array<{ lineIndex: number; unitPriceKopecks: number }> = [];

  items.forEach((item, lineIndex) => {
    validatePricingItem(item);

    if (!PHYSICAL_ITEM_TYPES.has(item.itemType)) {
      return;
    }

    for (let unitIndex = 0; unitIndex < item.quantity; unitIndex += 1) {
      eligibleUnits.push({ lineIndex, unitPriceKopecks: item.unitPriceKopecks });
    }
  });

  if (eligibleUnits.length < 2) {
    return new Map<number, number>();
  }

  const cheapestUnit = eligibleUnits.reduce((cheapest, unit) =>
    unit.unitPriceKopecks < cheapest.unitPriceKopecks ? unit : cheapest
  );
  const discountKopecks = Math.floor(
    (cheapestUnit.unitPriceKopecks * SECOND_PHYSICAL_ITEM_DISCOUNT_PERCENT) / 100
  );

  return new Map([[cheapestUnit.lineIndex, discountKopecks]]);
}

function validatePricingItem(item: OrderPricingInputItem) {
  if (!Number.isInteger(item.unitPriceKopecks) || item.unitPriceKopecks <= 0) {
    throw new Error("unitPriceKopecks must be a positive integer");
  }

  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    throw new Error("quantity must be a positive integer");
  }

  if (item.customDrawingStyle && !(item.customDrawingStyle in CUSTOM_DRAWING_SURCHARGE_KOPECKS)) {
    throw new Error("customDrawingStyle is not supported");
  }
}
