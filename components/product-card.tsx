"use client";

import { Eye } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/pricing";
import { ProductVisual } from "@/components/product-visual";
import { ActionButton } from "@/components/action-button";

export function ProductCard({
  product,
  onOpen
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  return (
    <article className="glass-panel rounded-[24px] p-3">
      <ProductVisual product={product} compact />
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
    </article>
  );
}
