"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ImagePlus, Sparkles, Wand2, X } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/products";
import {
  formatPrice,
  getDefaultSelection,
  getPrice,
  getTypeLabel,
  priceOptions,
  type ProductSize,
  type ProductType
} from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import { ActionButton } from "@/components/action-button";
import { ProductVisual } from "@/components/product-visual";

export function ProductModal({
  product,
  onClose
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const defaultSelection = getDefaultSelection();
  const [selectedType, setSelectedType] = useState<ProductType>(defaultSelection.type);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(defaultSelection.size);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (product) {
      setSelectedType(defaultSelection.type);
      setSelectedSize(defaultSelection.size);
      setActiveImage(product.coverImage);
      setAdded(false);
    }
  }, [product, defaultSelection.size, defaultSelection.type]);

  const activeOption = useMemo(
    () => priceOptions.find((option) => option.type === selectedType) ?? priceOptions[0],
    [selectedType]
  );

  useEffect(() => {
    if (!activeOption.sizes.some((item) => item.size === selectedSize)) {
      setSelectedSize(activeOption.sizes[0].size);
    }
  }, [activeOption, selectedSize]);

  if (!product) {
    return null;
  }

  const price = getPrice(selectedType, selectedSize);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      title: product.title,
      category: product.category,
      subcategory: product.subcategory,
      type: selectedType,
      typeLabel: getTypeLabel(selectedType),
      size: selectedSize,
      price,
      accent: product.accent,
      coverImage: product.coverImage,
      isCustom: product.isCustom
    });
    setAdded(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/70 px-4 py-5 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="mx-auto flex max-h-[92vh] max-w-xl flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[#080913] shadow-[0_0_80px_rgba(155,92,255,0.24)]"
          initial={{ y: 30, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 24, scale: 0.98 }}
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-neon-cyan">карточка</p>
              <h2 className="text-xl font-black text-white">{product.title}</h2>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8"
              onClick={onClose}
              aria-label="Закрыть карточку товара"
            >
              <X size={19} />
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            <ProductVisual product={{ ...product, coverImage: activeImage ?? product.coverImage }} priority />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {product.galleryImages.map((image) => (
                <button
                  key={image}
                  className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition ${
                    (activeImage ?? product.coverImage) === image
                      ? "border-neon-cyan/70 shadow-glow"
                      : "border-white/10 opacity-72"
                  }`}
                  onClick={() => setActiveImage(image)}
                  aria-label={`Показать изображение ${product.title}`}
                >
                  <Image
                    src={image}
                    alt={`Дополнительное изображение ${product.title}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/58">
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1">
                {product.category}
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1">
                {product.subcategory}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/72">{product.description}</p>

            <div className="mt-4 grid gap-2">
              {[
                { icon: Sparkles, text: "Мягкое тёплое свечение" },
                { icon: Wand2, text: "Изготовим под заказ" },
                { icon: ImagePlus, text: "Можно изменить дизайн под себя" }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-3 py-2">
                    <Icon size={16} className="text-neon-cyan" />
                    <span className="text-sm font-semibold text-white/76">{item.text}</span>
                  </div>
                );
              })}
            </div>

            {product.isCustom ? (
              <div className="mt-4 rounded-3xl border border-dashed border-neon-cyan/35 bg-neon-cyan/5 p-4 text-center">
                <ImagePlus className="mx-auto text-neon-cyan" size={28} />
                <p className="mt-2 text-sm font-bold text-white">Загрузка картинки будет подключена позже</p>
                <p className="mt-1 text-xs text-white/55">Сейчас это UI-заглушка для MVP без backend.</p>
              </div>
            ) : null}

            <section className="mt-5">
              <h3 className="text-sm font-bold text-white">Тип изделия</h3>
              <div className="mt-3 grid gap-2">
                {priceOptions.map((option) => (
                  <button
                    key={option.type}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selectedType === option.type
                        ? "border-neon-cyan/50 bg-neon-cyan/10 text-white shadow-glow"
                        : "border-white/10 bg-white/6 text-white/70"
                    }`}
                    onClick={() => setSelectedType(option.type)}
                  >
                    <span className="font-bold">{option.label}</span>
                    {selectedType === option.type ? <Check size={18} /> : null}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-bold text-white">Размер</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {activeOption.sizes.map((item) => (
                  <button
                    key={item.size}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                      selectedSize === item.size
                        ? "border-neon-violet/60 bg-neon-violet/15 text-white shadow-violet"
                        : "border-white/10 bg-white/6 text-white/68"
                    }`}
                    onClick={() => setSelectedSize(item.size)}
                  >
                    {item.size}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="border-t border-white/10 bg-night/92 p-4">
            <div className="mb-3 flex items-end justify-between">
              <span className="text-sm text-white/55">Цена</span>
              <span className="text-2xl font-black text-white">{formatPrice(price)} ₽</span>
            </div>
            <ActionButton className="w-full" onClick={handleAdd}>
              {added ? "Добавлено в корзину" : "Добавить в корзину"}
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
