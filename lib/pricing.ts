export const formatPrice = (price: number) => new Intl.NumberFormat("ru-RU").format(price);

export const formatKopecks = (priceKopecks: number) => formatPrice(priceKopecks / 100);
