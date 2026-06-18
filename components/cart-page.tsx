"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActionButton } from "@/components/action-button";
import { ProductVisual } from "@/components/product-visual";
import { EmptyState } from "@/components/ui/empty-state";
import { renderContentBlockLines, useContentBlocks } from "@/components/use-content-blocks";
import { formatKopecks } from "@/lib/pricing";
import type { StorefrontSettings } from "@/lib/storefront-types";
import { useCartStore, useCartTotals } from "@/store/cart-store";

export function CartPage({
  settings
}: {
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  const { getBlock } = useContentBlocks(["cart-empty-state"]);
  const items = useCartStore((state) => state.items);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const { totalKopecks } = useCartTotals();
  const emptyBlock = getBlock("cart-empty-state");

  return (
    <AppShell settings={settings}>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">корзина</p>
        <h1 className="mt-2 text-3xl font-black text-white">Корзина</h1>
      </section>

      {items.length === 0 && emptyBlock ? (
        <EmptyState
          className="mt-6"
          showWatermark={false}
          title={emptyBlock.title}
          bodyLines={emptyBlock.body ? renderContentBlockLines(emptyBlock.body) : []}
          ctaHref={emptyBlock.ctaHref}
          ctaLabel={emptyBlock.ctaLabel}
        />
      ) : (
        <>
          <div className="mt-5 grid gap-4">
            {items.map((item) => (
              <article key={item.lineId} className="glass-panel rounded-[24px] p-3">
                <div className="grid grid-cols-[112px_1fr] gap-3">
                  <ProductVisual
                    compact
                    product={{
                      name: item.productName,
                      accent: item.accent,
                      motif: item.isCustom ? "идея" : item.subcategory,
                      coverImage: item.coverImage
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-white/48">{item.category} • {item.subcategory}</p>
                    <h2 className="mt-1 text-base font-black text-white">{item.productName}</h2>
                    <p className="mt-2 text-xs text-white/58">{item.itemTypeLabel}, {item.sizeLabel}</p>
                    {item.note ? (
                      <p className="mt-2 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-xs font-semibold text-neon-cyan">
                        {item.note}
                      </p>
                    ) : null}
                    <p className="mt-2 text-lg font-black text-white">{formatKopecks(item.unitPriceKopecks)} ₽</p>
                    {item.customDrawingStyle ? (
                      <p className="mt-2 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-xs font-semibold text-neon-cyan">
                        Свой дизайн: {item.customImageFileName ?? "изображение загружено"}.
                        Проверка макета перед подтверждением заказа.
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-2xl border border-white/10 bg-white/7">
                        <button
                          className="flex h-9 w-9 items-center justify-center"
                          onClick={() => decrement(item.lineId)}
                          aria-label="Уменьшить количество"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                        <button
                          className="flex h-9 w-9 items-center justify-center"
                          onClick={() => increment(item.lineId)}
                          aria-label="Увеличить количество"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <button
                        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/7 text-white/64"
                        onClick={() => removeItem(item.lineId)}
                        aria-label="Удалить товар"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/58">Итого</span>
              <span className="text-2xl font-black text-white">{formatKopecks(totalKopecks)} ₽</span>
            </div>
            <Link href="/checkout">
              <ActionButton className="mt-4 w-full">Перейти к оформлению</ActionButton>
            </Link>
          </div>
        </>
      )}
    </AppShell>
  );
}
