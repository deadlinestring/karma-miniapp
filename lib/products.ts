export type CategoryName = "Аниме" | "Игры" | "Фильмы" | "Машины";

export type Product = {
  id: string;
  title: string;
  category: CategoryName;
  subcategory: string;
  description: string;
  accent: "violet" | "cyan" | "blue" | "pink";
  motif: string;
  coverImage: string;
  galleryImages: string[];
  isFeatured: boolean;
  isCustom?: boolean;
};

export const categories: Array<{
  name: CategoryName;
  subcategories: string[];
}> = [
  { name: "Аниме", subcategories: ["Наруто", "Атака титанов"] },
  { name: "Игры", subcategories: ["Minecraft", "Cyberpunk 2077"] },
  { name: "Фильмы", subcategories: ["Гарри Поттер", "Звёздные войны"] },
  { name: "Машины", subcategories: ["BMW", "Nissan"] }
];

export const products: Product[] = [
  {
    id: "naruto-uzumaki",
    title: "Наруто Узумаки",
    category: "Аниме",
    subcategory: "Наруто",
    description: "Яркий ночник с силуэтом Наруто и мягким тёплым свечением.",
    accent: "violet",
    motif: "спираль",
    coverImage: "/images/mock/product-violet.svg",
    galleryImages: [
      "/images/mock/product-violet.svg",
      "/images/mock/product-cyan.svg",
      "/images/mock/product-pink.svg"
    ],
    isFeatured: true
  },
  {
    id: "itachi-uchiha",
    title: "Итачи Учиха",
    category: "Аниме",
    subcategory: "Наруто",
    description: "Лаконичный световой силуэт с глубоким красно-фиолетовым настроением.",
    accent: "pink",
    motif: "луна",
    coverImage: "/images/mock/product-pink.svg",
    galleryImages: [
      "/images/mock/product-pink.svg",
      "/images/mock/product-violet.svg",
      "/images/mock/product-blue.svg"
    ],
    isFeatured: false
  },
  {
    id: "levi-ackerman",
    title: "Леви Аккерман",
    category: "Аниме",
    subcategory: "Атака титанов",
    description: "Динамичная композиция для комнаты с характером и холодным светом.",
    accent: "blue",
    motif: "клинки",
    coverImage: "/images/mock/product-blue.svg",
    galleryImages: [
      "/images/mock/product-blue.svg",
      "/images/mock/product-cyan.svg",
      "/images/mock/product-violet.svg"
    ],
    isFeatured: true
  },
  {
    id: "creeper",
    title: "Крипер",
    category: "Игры",
    subcategory: "Minecraft",
    description: "Пиксельный ночник с узнаваемой игровой геометрией и мягким зелёным свечением.",
    accent: "cyan",
    motif: "пиксели",
    coverImage: "/images/mock/product-cyan.svg",
    galleryImages: [
      "/images/mock/product-cyan.svg",
      "/images/mock/product-blue.svg",
      "/images/mock/product-violet.svg"
    ],
    isFeatured: false
  },
  {
    id: "samurai",
    title: "Samurai",
    category: "Игры",
    subcategory: "Cyberpunk 2077",
    description: "Неоновая панель в духе ночного города, музыки и технологичного бунта.",
    accent: "pink",
    motif: "неон",
    coverImage: "/images/mock/product-pink.svg",
    galleryImages: [
      "/images/mock/product-pink.svg",
      "/images/mock/product-blue.svg",
      "/images/mock/product-cyan.svg"
    ],
    isFeatured: true
  },
  {
    id: "hogwarts",
    title: "Хогвартс",
    category: "Фильмы",
    subcategory: "Гарри Поттер",
    description: "Атмосферный ночник с силуэтом замка и мягким сказочным свечением.",
    accent: "violet",
    motif: "замок",
    coverImage: "/images/mock/product-violet.svg",
    galleryImages: [
      "/images/mock/product-violet.svg",
      "/images/mock/product-blue.svg",
      "/images/mock/product-pink.svg"
    ],
    isFeatured: false
  },
  {
    id: "darth-vader",
    title: "Дарт Вейдер",
    category: "Фильмы",
    subcategory: "Звёздные войны",
    description: "Контрастная световая панель с тёмным силуэтом и холодным космическим акцентом.",
    accent: "blue",
    motif: "шлем",
    coverImage: "/images/mock/product-blue.svg",
    galleryImages: [
      "/images/mock/product-blue.svg",
      "/images/mock/product-pink.svg",
      "/images/mock/product-cyan.svg"
    ],
    isFeatured: false
  },
  {
    id: "bmw-m5",
    title: "BMW M5",
    category: "Машины",
    subcategory: "BMW",
    description: "Световая линия для фанатов быстрых седанов и гаражной эстетики.",
    accent: "cyan",
    motif: "скорость",
    coverImage: "/images/mock/product-cyan.svg",
    galleryImages: [
      "/images/mock/product-cyan.svg",
      "/images/mock/product-blue.svg",
      "/images/mock/product-violet.svg"
    ],
    isFeatured: true
  },
  {
    id: "nissan-skyline",
    title: "Nissan Skyline GT-R",
    category: "Машины",
    subcategory: "Nissan",
    description: "Ночная панель с японским настроением и выразительным контуром легенды.",
    accent: "blue",
    motif: "контур",
    coverImage: "/images/mock/product-blue.svg",
    galleryImages: [
      "/images/mock/product-blue.svg",
      "/images/mock/product-cyan.svg",
      "/images/mock/product-pink.svg"
    ],
    isFeatured: false
  },
  {
    id: "custom-design",
    title: "Ночник по вашей картинке",
    category: "Аниме",
    subcategory: "По вашей картинке",
    description: "Отправьте фото, арт или идею — мы подготовим дизайн специально для вас.",
    accent: "violet",
    motif: "идея",
    coverImage: "/images/mock/product-custom.svg",
    galleryImages: [
      "/images/mock/product-custom.svg",
      "/images/mock/product-violet.svg",
      "/images/mock/product-cyan.svg"
    ],
    isFeatured: true,
    isCustom: true,
  }
];

export const popularProducts = products.filter((product) => product.isFeatured);
