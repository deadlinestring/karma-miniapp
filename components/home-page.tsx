"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Brush, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { StorefrontHomeData, StorefrontProduct } from "@/lib/storefront-types";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { BrandMaskWatermark } from "@/components/ui/brand-mask-watermark";
import { uiButtonClassName } from "@/components/ui/button";
import {
  neonMaskBackground,
  neonMaskBorder,
  neonMaskEyebrow,
  neonMaskGradientText,
  neonMaskHover,
  neonMaskMutedText,
  neonMaskSurface
} from "@/components/ui/neon-mask-tokens";
import type { UiContentBlock } from "@/components/use-content-blocks";
import { useContentBlocks } from "@/components/use-content-blocks";

const homeContentSlugs = [
  "home-hero-eyebrow",
  "home-hero-title",
  "home-hero-subtitle",
  "home-hero-primary-cta",
  "home-hero-secondary-cta"
];

export function HomePage({
  data,
  loadError = false
}: {
  data: StorefrontHomeData | null;
  loadError?: boolean;
}) {
  const [openedProduct, setOpenedProduct] = useState<StorefrontProduct | null>(null);
  const { getBlock } = useContentBlocks(homeContentSlugs);

  if (loadError || !data) {
    return (
      <AppShell>
        <CatalogLoadError />
      </AppShell>
    );
  }

  const heroImage = data.settings.heroImageUrl || "/images/mock/hero-night-light.svg";
  const heroEyebrowBlock = getBlock("home-hero-eyebrow");
  const heroTitleBlock = getBlock("home-hero-title");
  const heroSubtitleBlock = getBlock("home-hero-subtitle");
  const primaryCtaBlock = getBlock("home-hero-primary-cta");
  const secondaryCtaBlock = getBlock("home-hero-secondary-cta");
  const heroEyebrow = contentBlockText(heroEyebrowBlock);
  const heroTitle = heroTitleBlock ? contentBlockText(heroTitleBlock) ?? data.settings.heroTitle : null;
  const heroSubtitle = heroSubtitleBlock ? contentBlockText(heroSubtitleBlock) ?? data.settings.heroSubtitle : null;
  const primaryCtaLabel = contentBlockCtaLabel(primaryCtaBlock);
  const secondaryCtaLabel = contentBlockCtaLabel(secondaryCtaBlock);

  return (
    <AppShell settings={data.settings}>
      <section className={`relative isolate min-h-[560px] overflow-hidden rounded-[32px] ${neonMaskBorder} ${neonMaskBackground} p-4 shadow-[0_0_70px_rgba(155,92,255,0.24)] sm:p-6`}>
        <img
          src={heroImage}
          alt={`Светящийся акриловый ночник ${data.settings.storeName}`}
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-78 saturate-125 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.98),rgba(0,0,0,0.58))]"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/18 via-[#07030f]/54 to-[#05030b]/92" />
        <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_30%_18%,rgba(255,79,216,0.18),transparent_18rem),radial-gradient(circle_at_80%_40%,rgba(49,246,255,0.16),transparent_18rem)]" />
        <BrandMaskWatermark variant="hero" className="absolute -right-28 top-12 z-30 rotate-6 opacity-[0.22] sm:-right-20 sm:top-16" />
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-50 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

        <div className="relative flex min-h-[528px] flex-col justify-end">
          <div className="relative max-w-[440px] overflow-hidden rounded-[28px] p-4 sm:p-5">
            <div className={`absolute inset-0 z-20 rounded-[28px] ${neonMaskSurface}`} />
            <div className="absolute inset-0 z-30 rounded-[28px] bg-[radial-gradient(circle_at_85%_20%,rgba(255,79,216,0.10),transparent_13rem)]" />
            <div className="relative z-40">
              {heroEyebrow ? (
                <p className={`text-[11px] tracking-[0.24em] ${neonMaskEyebrow}`}>
                  {heroEyebrow}
                </p>
              ) : null}
              {heroTitle ? (
                <h1 className={`mt-5 text-4xl font-black leading-[1.05] sm:text-5xl ${neonMaskGradientText}`}>
                  {heroTitle}
                </h1>
              ) : null}
              {heroSubtitle ? (
                <p className={`mt-4 text-base leading-7 ${neonMaskMutedText}`}>
                  {heroSubtitle}
                </p>
              ) : null}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {primaryCtaLabel ? (
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Link
                      href={primaryCtaBlock?.ctaHref ?? "/catalog"}
                      className={uiButtonClassName({
                        variant: "mask",
                        className: `h-14 w-full text-sm font-black ${neonMaskHover}`
                      })}
                    >
                      {primaryCtaLabel}
                    </Link>
                  </motion.div>
                ) : null}
                {secondaryCtaLabel && data.customProduct ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    className={uiButtonClassName({
                      variant: "secondary",
                      className: `h-14 w-full text-sm font-black ${neonMaskHover}`
                    })}
                    onClick={() => setOpenedProduct(data.customProduct)}
                  >
                    {secondaryCtaLabel}
                  </motion.button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-black tracking-[0.02em] text-white">Категории</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {data.categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${encodeURIComponent(category.name)}`}
              className={`rounded-lg p-4 ${neonMaskSurface} ${neonMaskHover}`}
            >
              <p className="text-lg font-black text-white">{category.name}</p>
              <p className="mt-2 text-xs text-white/52">
                {category.subcategories.map((subcategory) => subcategory.name).join(" • ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-black tracking-[0.02em] text-white">Популярное</h2>
          <Link href="/catalog" className="text-sm font-bold text-neon-cyan">
            Все товары
          </Link>
        </div>
        <div className="mt-3 grid gap-4">
          {data.featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={setOpenedProduct} variant="featured" />
          ))}
        </div>
      </section>

      <section className="mt-7 grid gap-3">
        {[
          { icon: Sparkles, title: "Мягкое свечение", text: "Атмосфера без резкого света" },
          { icon: Wand2, title: "Изготовление под заказ", text: "Подберём размер и стиль" },
          { icon: Brush, title: "Свой дизайн по картинке", text: "Фото, арт или идея для макета" }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className={`flex items-center gap-4 rounded-lg p-4 ${neonMaskSurface}`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-neon-cyan/20 bg-neon-cyan/8 text-neon-cyan shadow-[0_0_18px_rgba(49,246,255,0.1)]">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-black text-white">{item.title}</span>
                <span className="text-sm text-white/56">{item.text}</span>
              </span>
            </div>
          );
        })}
      </section>

      <ProductModal product={openedProduct} onClose={() => setOpenedProduct(null)} />
    </AppShell>
  );
}

function CatalogLoadError() {
  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center shadow-violet">
      <h1 className="text-2xl font-black text-white">Не удалось загрузить каталог</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Попробуйте обновить страницу чуть позже.</p>
    </div>
  );
}

function contentBlockText(block: UiContentBlock | null) {
  return block?.title?.trim() || block?.body?.trim() || null;
}

function contentBlockCtaLabel(block: UiContentBlock | null) {
  return block?.ctaLabel?.trim() || block?.title?.trim() || block?.body?.trim() || null;
}
