"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import type { StorefrontProduct } from "@/lib/storefront-types";
import { formatKopecks } from "@/lib/pricing";
import { ProductVisual } from "@/components/product-visual";
import { ActionButton } from "@/components/action-button";
import { neonMaskElevatedSurface } from "@/components/ui/neon-mask-tokens";

const productCardHover =
  "transition duration-150 ease-out motion-reduce:transition-none hover:-translate-y-px hover:brightness-[1.025] active:translate-y-0 motion-reduce:hover:translate-y-0";

function ProductPrice({ product, className = "text-sm" }: { product: StorefrontProduct; className?: string }) {
  if (!product.isOrderAvailable) {
    return <span className={`${className} font-bold text-neon-pink`}>Временно недоступен</span>;
  }

  return (
    <span className={className}>
      от <span className="font-black text-white">{formatKopecks(product.minPriceKopecks)} ₽</span>
    </span>
  );
}

export function ProductCard({
  product,
  onOpen,
  variant = "featured"
}: {
  product: StorefrontProduct;
  onOpen: (product: StorefrontProduct) => void;
  variant?: "featured" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div
        className={`group min-w-0 overflow-hidden rounded-xl text-left ${neonMaskElevatedSurface} ${productCardHover}`}
      >
        <Link href={`/catalog?product=${product.slug}`} onClick={() => onOpen(product)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/70">
          <ProductVisual product={product} compact />
          <div className="p-3">
            <div className="flex items-center gap-2">
              <span className="line-clamp-1 rounded-md bg-neon-violet/10 px-2 py-1 text-[10px] font-bold text-white/58">
                {product.subcategory}
              </span>
              {product.isCustom ? (
                <span className="rounded-md bg-neon-pink/10 px-2 py-1 text-[10px] font-bold text-neon-pink">
                  свой дизайн
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-white">
              {product.name}
            </h3>
            <p className="mt-2 text-xs text-white/62">
              <ProductPrice product={product} className="text-sm" />
            </p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <article
      className={`group overflow-hidden rounded-xl ${neonMaskElevatedSurface} ${productCardHover}`}
    >
      <ProductVisual product={product} />
      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-md bg-white/6 px-2 py-1 text-white/56">{product.category}</span>
          <span className="rounded-md bg-neon-violet/10 px-2 py-1 text-[#cfc5ff]/80">{product.subcategory}</span>
          {product.isCustom ? (
            <span className="rounded-md bg-neon-pink/10 px-2 py-1 font-bold text-neon-pink">
              свой дизайн
            </span>
          ) : null}
        </div>
        <h3 className="text-lg font-black text-white">{product.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/62">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-neon-violet/15 pt-4">
          <p className="text-sm text-white/60">
            <ProductPrice product={product} className="text-lg" />
          </p>
          <ActionButton className="flex items-center gap-2 px-3 py-2" onClick={() => onOpen(product)}>
            <Eye size={16} />
            Смотреть
          </ActionButton>
        </div>
      </div>
    </article>
  );
}
