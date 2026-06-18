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
import { Surface } from "@/components/ui/surface";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { neonMaskGradientText, neonMaskHover, neonMaskMutedText, neonMaskSurface } from "@/components/ui/neon-mask-tokens";
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
  const { getBlock } = useContentBlocks(["custom-design-help", "custom-product-features-help", "custom-upload-requirements-help"]);
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
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
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
      setLightboxImage(null);
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
  const customProductFeaturesBlock = getBlock("custom-product-features-help");
  const customUploadRequirementsBlock = getBlock("custom-upload-requirements-help");
  const customProductFeatureIcons = [Sparkles, Wand2, ImagePlus];
  const visibleImage = activeImage ?? product.coverImage;
  const visibleImageAlt = `Изображение товара ${product.name}`;

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
        className="fixed inset-0 z-[60] bg-[#020107]/82 px-4 py-5 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,79,216,0.14),transparent_18rem),radial-gradient(circle_at_82%_18%,rgba(49,246,255,0.13),transparent_20rem)]" />
        <motion.div
          className={`relative mx-auto flex max-h-[92vh] max-w-xl flex-col overflow-hidden rounded-[30px] ${neonMaskSurface} border-neon-violet/30`}
          initial={{ y: 30, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 24, scale: 0.98 }}
        >
          <div className="relative flex items-center justify-between border-b border-white/10 p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(49,246,255,0.12),transparent_14rem)]" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-neon-cyan">карточка</p>
              <h2 className={`text-xl font-black ${neonMaskGradientText}`}>{product.name}</h2>
            </div>
            <button
              type="button"
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white ${neonMaskHover}`}
              onClick={onClose}
              aria-label="Закрыть карточку товара"
            >
              <X size={19} />
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            <button
              type="button"
              onClick={() => setLightboxImage({ src: visibleImage, alt: visibleImageAlt })}
              className="block w-full rounded-[26px] border border-neon-violet/25 bg-white/5 p-2 text-left shadow-[0_0_30px_rgba(155,92,255,0.1)] transition duration-150 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/70"
              aria-label="Открыть изображение товара крупно"
            >
              <ProductVisual product={{ ...product, coverImage: visibleImage }} priority />
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {product.galleryImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`relative aspect-[4/3] overflow-hidden rounded-2xl border bg-[#08030f] transition duration-150 hover:brightness-110 ${
                    (activeImage ?? product.coverImage) === image
                      ? "border-neon-violet/60 shadow-[0_0_18px_rgba(155,92,255,0.18)]"
                      : "border-neon-violet/15 opacity-72"
                  }`}
                  onClick={() => {
                    setActiveImage(image);
                    setLightboxImage({ src: image, alt: `Изображение товара ${product.name}` });
                  }}
                  aria-label={`Показать изображение ${product.name}`}
                >
                  <Image
                    src={image}
                    alt={`Дополнительное изображение ${product.name}`}
                    fill
                    sizes="120px"
                    className="object-contain object-center p-1"
                  />
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/58">
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 font-bold">
                {product.category}
              </span>
              <span className="rounded-full border border-neon-cyan/20 bg-neon-cyan/8 px-3 py-1 font-bold text-neon-cyan/80">
                {product.subcategory}
              </span>
            </div>
            <p className={`mt-4 text-sm leading-6 ${neonMaskMutedText}`}>{product.description}</p>

            {customProductFeaturesBlock ? (
              <div className="mt-4 grid gap-2">
                {renderContentBlockLines(customProductFeaturesBlock.body).map((line, index) => {
                  const Icon = customProductFeatureIcons[index % customProductFeatureIcons.length];

                  return (
                    <div key={line} className="flex items-center gap-3 rounded-2xl border border-neon-violet/20 bg-white/7 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <Icon size={16} className="text-neon-cyan" />
                      <span className="text-sm font-semibold text-white/76">{line}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {product.isCustom ? (
              <div className="hidden">
                <ImagePlus className="mx-auto text-neon-cyan" size={28} />
                <p className="mt-2 text-sm font-bold text-white">Загрузка картинки будет подключена позже</p>
                <p className="mt-1 text-xs text-white/55">Сейчас это UI-заглушка для MVP без backend.</p>
              </div>
            ) : null}

            {product.isCustom ? (
              <Surface tone="mask" className="mt-4 border-dashed border-neon-cyan/35 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-neon-cyan/25 bg-neon-cyan/10">
                    <ImagePlus className="text-neon-cyan" size={22} />
                  </div>
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
                      type="button"
                      className={`flex min-h-14 items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${neonMaskHover} ${
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

                <label className="mt-4 block rounded-2xl border border-neon-violet/20 bg-[#05030b]/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  {customUploadRequirementsBlock?.title ? (
                    <span className="block text-sm font-bold text-white">{customUploadRequirementsBlock.title}</span>
                  ) : null}
                  {customUploadRequirementsBlock?.body ? (
                    <span className="mt-1 block text-xs text-white/54">{customUploadRequirementsBlock.body}</span>
                  ) : null}
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
              </Surface>
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
                        type="button"
                        className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${neonMaskHover} ${
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
                      type="button"
                      className={`min-h-12 rounded-2xl border px-3 py-3 text-sm font-bold transition ${neonMaskHover} ${
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

          <div className="border-t border-white/10 bg-[#05030b]/94 p-4 shadow-[0_-18px_40px_rgba(5,3,11,0.72)]">
            {selectedVariant?.note ? (
              <p className="mb-3 rounded-2xl border border-neon-cyan/25 bg-neon-cyan/10 px-3 py-2 text-sm font-semibold text-neon-cyan">
                {selectedVariant.note}
              </p>
            ) : null}
            <div className="mb-3 flex items-end justify-between rounded-3xl border border-neon-cyan/20 bg-neon-cyan/8 px-4 py-3">
              <span className="text-sm text-white/55">Цена</span>
              <span className="text-2xl font-black text-white">
                {selectedVariant ? `${formatKopecks(selectedVariant.priceKopecks)} ₽` : "—"}
              </span>
            </div>
            <ActionButton className="min-h-[52px] w-full shadow-[0_0_34px_rgba(49,246,255,0.2)]" onClick={handleAdd} disabled={!canAddToCart}>
              {added ? "Добавлено в корзину" : "Добавить в корзину"}
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
      <ImageLightbox src={lightboxImage?.src ?? null} alt={lightboxImage?.alt ?? ""} onClose={() => setLightboxImage(null)} />
    </AnimatePresence>
  );
}
