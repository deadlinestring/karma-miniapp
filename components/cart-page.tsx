"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActionButton } from "@/components/action-button";
import { ProductVisual } from "@/components/product-visual";
import { formatPrice } from "@/lib/pricing";
import { useCartStore, useCartTotals } from "@/store/cart-store";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const { total } = useCartTotals();

  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">корзина</p>
        <h1 className="mt-2 text-3xl font-black text-white">Твои будущие огни</h1>
      </section>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center shadow-violet">
          <div className="mx-auto h-24 w-24 rounded-full bg-neon-violet/15 blur-sm" />
          <h2 className="mt-4 text-xl font-black text-white">Корзина пока пустая</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Добавь ночник из каталога или собери изделие по своему дизайну.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
          >
            Открыть каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4">
            {items.map((item) => (
              <article key={item.lineId} className="glass-panel rounded-[24px] p-3">
                <div className="grid grid-cols-[112px_1fr] gap-3">
                  <ProductVisual
                    compact
                    product={{
                      title: item.title,
                      accent: item.accent,
                      motif: item.isCustom ? "идея" : item.subcategory
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-white/48">{item.category} • {item.subcategory}</p>
                    <h2 className="mt-1 text-base font-black text-white">{item.title}</h2>
                    <p className="mt-2 text-xs text-white/58">{item.typeLabel}, {item.size}</p>
                    <p className="mt-2 text-lg font-black text-white">{formatPrice(item.price)} ₽</p>
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
              <span className="text-2xl font-black text-white">{formatPrice(total)} ₽</span>
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
