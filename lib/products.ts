export type CategoryName = "Аниме" | "Игры" | "Фильмы" | "Машины";

export type Product = {
  id: string;
  title: string;
  category: CategoryName;
  subcategory: string;
  description: string;
  accent: "violet" | "cyan" | "blue" | "pink";
  motif: string;
  isCustom?: boolean;
  popular?: boolean;
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
    popular: true
  },
  {
    id: "itachi-uchiha",
    title: "Итачи Учиха",
    category: "Аниме",
    subcategory: "Наруто",
    description: "Лаконичный световой силуэт с глубоким красно-фиолетовым настроением.",
    accent: "pink",
    motif: "луна"
  },
  {
    id: "levi-ackerman",
    title: "Леви Аккерман",
    category: "Аниме",
    subcategory: "Атака титанов",
    description: "Динамичная композиция для комнаты с характером и холодным светом.",
    accent: "blue",
    motif: "клинки",
    popular: true
  },
  {
    id: "creeper",
    title: "Крипер",
    category: "Игры",
    subcategory: "Minecraft",
    description: "Пиксельный ночник с узнаваемой игровой геометрией и мягким зелёным свечением.",
    accent: "cyan",
    motif: "пиксели"
  },
  {
    id: "samurai",
    title: "Samurai",
    category: "Игры",
    subcategory: "Cyberpunk 2077",
    description: "Неоновая панель в духе ночного города, музыки и технологичного бунта.",
    accent: "pink",
    motif: "неон",
    popular: true
  },
  {
    id: "hogwarts",
    title: "Хогвартс",
    category: "Фильмы",
    subcategory: "Гарри Поттер",
    description: "Атмосферный ночник с силуэтом замка и мягким сказочным свечением.",
    accent: "violet",
    motif: "замок"
  },
  {
    id: "darth-vader",
    title: "Дарт Вейдер",
    category: "Фильмы",
    subcategory: "Звёздные войны",
    description: "Контрастная световая панель с тёмным силуэтом и холодным космическим акцентом.",
    accent: "blue",
    motif: "шлем"
  },
  {
    id: "bmw-m5",
    title: "BMW M5",
    category: "Машины",
    subcategory: "BMW",
    description: "Световая линия для фанатов быстрых седанов и гаражной эстетики.",
    accent: "cyan",
    motif: "скорость",
    popular: true
  },
  {
    id: "nissan-skyline",
    title: "Nissan Skyline GT-R",
    category: "Машины",
    subcategory: "Nissan",
    description: "Ночная панель с японским настроением и выразительным контуром легенды.",
    accent: "blue",
    motif: "контур"
  },
  {
    id: "custom-design",
    title: "Свой дизайн",
    category: "Аниме",
    subcategory: "По вашей картинке",
    description: "Отправьте фото, арт или идею — мы подготовим дизайн специально для вас.",
    accent: "violet",
    motif: "идея",
    isCustom: true,
    popular: true
  }
];

export const popularProducts = products.filter((product) => product.popular);
