export type ProductType = "standard" | "premium" | "wall";

export type ProductSize = "20 см" | "25 см" | "30 см" | "35 см" | "40 см" | "45 см" | "55 см";

export type PriceOption = {
  type: ProductType;
  label: string;
  sizes: Array<{
    size: ProductSize;
    price: number;
  }>;
};

export const priceOptions: PriceOption[] = [
  {
    type: "standard",
    label: "Стандарт",
    sizes: [
      { size: "20 см", price: 2490 },
      { size: "25 см", price: 3390 }
    ]
  },
  {
    type: "premium",
    label: "Премиум",
    sizes: [
      { size: "25 см", price: 4490 },
      { size: "30 см", price: 5490 },
      { size: "40 см", price: 6490 }
    ]
  },
  {
    type: "wall",
    label: "Настенная панель",
    sizes: [
      { size: "35 см", price: 5990 },
      { size: "45 см", price: 7490 },
      { size: "55 см", price: 8990 }
    ]
  }
];

export const formatPrice = (price: number) => new Intl.NumberFormat("ru-RU").format(price);

export const getTypeLabel = (type: ProductType) =>
  priceOptions.find((option) => option.type === type)?.label ?? "Стандарт";

export const getDefaultSelection = () => ({
  type: priceOptions[0].type,
  size: priceOptions[0].sizes[0].size,
  price: priceOptions[0].sizes[0].price
});

export const getPrice = (type: ProductType, size: ProductSize) => {
  const option = priceOptions.find((item) => item.type === type);
  return option?.sizes.find((item) => item.size === size)?.price ?? 0;
};
