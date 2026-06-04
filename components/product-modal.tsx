"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ImagePlus, Sparkles, Wand2, X } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { StorefrontItemType, StorefrontProduct, StorefrontVariant } from "@/lib/storefront-types";
import { formatKopecks } from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import { ActionButton } from "@/components/action-button";
import { ProductVisual } from "@/components/product-visual";
import { renderContentBlockLines, useContentBlocks } from "@/components/use-content-blocks";

const itemTypeOrder: StorefrontItemType[] = ["STANDARD", "PREMIUM", "WALL_PANEL"];
const customStyleOptions = [
  { value: "CUSTOM_DRAWING_STYLE_1", label: "Стиль 1", priceKopecks: 69000 },
  { value: "CUSTOM_DRAWING_STYLE_2", label: "Стиль 2", priceKopecks: 79000 },
  { value: "CUSTOM_DRAWING_STYLE_3", label: "Стиль 3", priceKopecks: 99000 }
] as const;

export function ProductModal({
  product,
  onClose
}: {
  product: StorefrontProduct | null;
  onClose: () => void;
}) {
  const { getBlock } = useContentBlocks(["custom-design-help"]);
  const [selectedType, setSelectedType] = useState<StorefrontItemType>("STANDARD");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [selectedCustomStyle, setSelectedCustomStyle] =
    useState<(typeof customStyleOptions)[number]["value"]>("CUSTOM_DRAWING_STYLE_1");
  const [customUpload, setCustomUpload] = useState<{
    customDesignKey: string;
    storagePath: string;
    fileName: string;
  } | null>(null);
  const [customUploadError, setCustomUploadError] = useState<string | null>(null);
  const [isCustomUploading, setIsCustomUploading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const variantsByType = useMemo(() => {
    const groups = new Map<StorefrontItemType, StorefrontVariant[]>();

    for (const variant of product?.variants ?? []) {
      const variants = groups.get(variant.itemType) ?? [];
      groups.set(
        variant.itemType,
        [...variants, variant].sort((a, b) => a.sortOrder - b.sortOrder || a.sizeCm - b.sizeCm)
      );
    }

    return groups;
  }, [product]);

  const availableTypes = useMemo(
    () => itemTypeOrder.filter((type) => variantsByType.has(type)),
    [variantsByType]
  );

  useEffect(() => {
    if (product) {
      const firstVariant = product.variants[0];
      setSelectedType(firstVariant?.itemType ?? "STANDARD");
      setSelectedVariantId(firstVariant?.priceListItemId ?? null);
      setActiveImage(product.coverImage);
      setAdded(false);
      setSelectedCustomStyle("CUSTOM_DRAWING_STYLE_1");
      setCustomUpload(null);
      setCustomUploadError(null);
      setIsCustomUploading(false);
    }
  }, [product]);

  const activeVariants = useMemo(
    () => variantsByType.get(selectedType) ?? [],
    [selectedType, variantsByType]
  );

  useEffect(() => {
    if (!activeVariants.some((variant) => variant.priceListItemId === selectedVariantId)) {
      setSelectedVariantId(activeVariants[0]?.priceListItemId ?? null);
    }
  }, [activeVariants, selectedVariantId]);

  if (!product) {
    return null;
  }

  const selectedVariant =
    activeVariants.find((variant) => variant.priceListItemId === selectedVariantId) ??
    activeVariants[0] ??
    product.variants[0];
  const customDesignHelpBlock = getBlock("custom-design-help");

  const canAddToCart =
    Boolean(selectedVariant) &&
    product.isOrderAvailable &&
    (!product.isCustom || Boolean(customUpload));

  const handleCustomUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    const initData = window.Telegram?.WebApp?.initData;

    if (!initData) {
      setCustomUpload(null);
      setCustomUploadError("Загрузка изображения доступна внутри Telegram Mini App.");
      return;
    }

    setIsCustomUploading(true);
    setCustomUploadError(null);
    setCustomUpload(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/orders/custom-upload", {
        method: "POST",
        headers: { "X-Telegram-Init-Data": initData },
        body: formData
      });
      const body = (await response.json()) as
        | {
            ok: true;
            upload: {
              customDesignKey: string;
              storagePath: string;
              fileName: string;
            };
          }
        | { ok: false; message: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.ok ? "Не удалось загрузить изображение." : body.message);
      }

      setCustomUpload(body.upload);
    } catch (error) {
      setCustomUploadError(
        error instanceof Error ? error.message : "Не удалось загрузить изображение."
      );
    } finally {
      setIsCustomUploading(false);
    }
  };

  const handleAdd = () => {
    if (!selectedVariant || !product.isOrderAvailable) {
      return;
    }

    if (product.isCustom && !customUpload) {
      setCustomUploadError("Загрузите изображение для своего дизайна.");
      return;
    }

    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      category: product.category,
      subcategory: product.subcategory,
      priceListItemId: selectedVariant.priceListItemId,
      itemType: selectedVariant.itemType,
      itemTypeLabel: selectedVariant.itemTypeLabel,
      sizeCm: selectedVariant.sizeCm,
      sizeLabel: selectedVariant.sizeLabel,
      unitPriceKopecks: selectedVariant.priceKopecks,
      note: selectedVariant.note,
      coverImage: product.coverImage,
      isCustom: product.isCustom,
      customDrawingStyle: product.isCustom ? selectedCustomStyle : null,
      customDesignKey: product.isCustom ? customUpload?.customDesignKey ?? null : null,
      customImageStoragePath: product.isCustom ? customUpload?.storagePath ?? null : null,
      customImageFileName: product.isCustom ? customUpload?.fileName ?? null : null,
      accent: product.accent
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
              <h2 className="text-xl font-black text-white">{product.name}</h2>
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
                  aria-label={`Показать изображение ${product.name}`}
                >
                  <Image
                    src={image}
                    alt={`Дополнительное изображение ${product.name}`}
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
                { icon: Sparkles, text: "Мягкое теплое свечение" },
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
              <div className="hidden">
                <ImagePlus className="mx-auto text-neon-cyan" size={28} />
                <p className="mt-2 text-sm font-bold text-white">Загрузка картинки будет подключена позже</p>
                <p className="mt-1 text-xs text-white/55">Сейчас это UI-заглушка для MVP без backend.</p>
              </div>
            ) : null}

            {product.isCustom ? (
              <section className="mt-4 rounded-3xl border border-dashed border-neon-cyan/35 bg-neon-cyan/5 p-4">
                <div className="flex items-start gap-3">
                  <ImagePlus className="mt-1 shrink-0 text-neon-cyan" size={24} />
                  <div>
                    {customDesignHelpBlock ? (
                      <>
                        {customDesignHelpBlock.title ? <h3 className="text-sm font-black text-white">{customDesignHelpBlock.title}</h3> : null}
                        <div className="mt-1 grid gap-1 text-xs leading-5 text-white/60">
                          {renderContentBlockLines(customDesignHelpBlock.body).map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                        {customDesignHelpBlock.ctaHref && customDesignHelpBlock.ctaLabel ? (
                          <Link href={customDesignHelpBlock.ctaHref} className="mt-2 inline-flex text-xs font-bold text-neon-cyan">
                            {customDesignHelpBlock.ctaLabel}
                          </Link>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {customStyleOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                        selectedCustomStyle === option.value
                          ? "border-neon-cyan/55 bg-neon-cyan/12 text-white shadow-glow"
                          : "border-white/10 bg-white/6 text-white/70"
                      }`}
                      onClick={() => setSelectedCustomStyle(option.value)}
                    >
                      <span className="text-sm font-bold">{option.label}</span>
                      <span className="text-sm font-black">+{formatKopecks(option.priceKopecks)} ₽</span>
                    </button>
                  ))}
                </div>

                <label className="mt-4 block rounded-2xl border border-white/10 bg-white/7 p-3">
                  <span className="block text-sm font-bold text-white">Изображение</span>
                  <span className="mt-1 block text-xs text-white/54">JPEG, PNG или WEBP до 8 МБ</span>
                  <input
                    className="mt-3 block w-full text-xs text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-neon-cyan/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-neon-cyan"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isCustomUploading}
                    onChange={(event) => handleCustomUpload(event.target.files?.[0] ?? null)}
                  />
                </label>

                {isCustomUploading ? (
                  <p className="mt-3 rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-white/70">
                    Загружаем изображение...
                  </p>
                ) : null}
                {customUpload ? (
                  <p className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
                    Изображение загружено: {customUpload.fileName}
                  </p>
                ) : null}
                {customUploadError ? (
                  <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
                    {customUploadError}
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className="mt-5">
              <h3 className="text-sm font-bold text-white">Тип изделия</h3>
              {product.isOrderAvailable ? (
                <div className="mt-3 grid gap-2">
                  {availableTypes.map((type) => {
                    const option = variantsByType.get(type)?.[0];

                    if (!option) {
                      return null;
                    }

                    return (
                      <button
                        key={type}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          selectedType === type
                            ? "border-neon-cyan/50 bg-neon-cyan/10 text-white shadow-glow"
                            : "border-white/10 bg-white/6 text-white/70"
                        }`}
                        onClick={() => setSelectedType(type)}
                      >
                        <span className="font-bold">{option.itemTypeLabel}</span>
                        {selectedType === type ? <Check size={18} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-neon-pink/25 bg-neon-pink/10 p-4 text-sm font-bold text-neon-pink">
                  Временно недоступен для заказа
                </div>
              )}
            </section>

            {product.isOrderAvailable ? (
              <section className="mt-5">
                <h3 className="text-sm font-bold text-white">Размер</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {activeVariants.map((variant) => (
                    <button
                      key={variant.priceListItemId}
                      className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                        selectedVariant?.priceListItemId === variant.priceListItemId
                          ? "border-neon-violet/60 bg-neon-violet/15 text-white shadow-violet"
                          : "border-white/10 bg-white/6 text-white/68"
                      }`}
                      onClick={() => setSelectedVariantId(variant.priceListItemId)}
                    >
                      {variant.sizeLabel}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-night/92 p-4">
            {selectedVariant?.note ? (
              <p className="mb-3 rounded-2xl border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-2 text-sm font-semibold text-neon-cyan">
                {selectedVariant.note}
              </p>
            ) : null}
            <div className="mb-3 flex items-end justify-between">
              <span className="text-sm text-white/55">Цена</span>
              <span className="text-2xl font-black text-white">
                {selectedVariant ? `${formatKopecks(selectedVariant.priceKopecks)} ₽` : "—"}
              </span>
            </div>
            <ActionButton className="w-full" onClick={handleAdd} disabled={!canAddToCart}>
              {added ? "Добавлено в корзину" : "Добавить в корзину"}
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
