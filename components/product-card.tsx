"use client";

import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/pricing";
import { ProductVisual } from "@/components/product-visual";
import { ActionButton } from "@/components/action-button";

export function ProductCard({
  product,
  onOpen,
  variant = "featured"
}: {
  product: Product;
  onOpen: (product: Product) => void;
  variant?: "featured" | "compact";
}) {
  if (variant === "compact") {
    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="group min-w-0 rounded-[22px] border border-white/10 bg-white/7 p-2 text-left shadow-[0_0_22px_rgba(49,246,255,0.08)] transition duration-300 hover:border-neon-cyan/28 hover:bg-white/10 hover:shadow-glow"
      >
        <Link href={`/catalog?product=${product.id}`} onClick={() => onOpen(product)} className="block">
          <ProductVisual product={product} compact />
          <div className="px-1 pb-1 pt-3">
            <p className="line-clamp-1 text-[11px] text-white/48">{product.subcategory}</p>
            <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-white">
              {product.title}
            </h3>
            <p className="mt-2 text-xs text-white/58">
              от <span className="text-sm font-black text-white">{formatPrice(2490)} ₽</span>
            </p>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      whileTap={{ scale: 0.985 }}
      className="group glass-panel rounded-[24px] p-3 transition duration-300 hover:border-neon-cyan/28 hover:shadow-glow"
    >
      <ProductVisual product={product} />
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] text-white/52">
          <span>{product.category}</span>
          <span className="h-1 w-1 rounded-full bg-neon-cyan/70" />
          <span>{product.subcategory}</span>
        </div>
        <h3 className="text-lg font-black text-white">{product.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/62">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">
            от <span className="text-lg font-black text-white">{formatPrice(2490)} ₽</span>
          </p>
          <ActionButton className="flex items-center gap-2 px-3 py-2" onClick={() => onOpen(product)}>
            <Eye size={16} />
            Смотреть
          </ActionButton>
        </div>
      </div>
    </motion.article>
  );
}
