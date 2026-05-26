"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { ActionButton } from "@/components/action-button";
import { formatKopecks } from "@/lib/pricing";
import { useCartStore, useCartTotals } from "@/store/cart-store";

const fields = [
  { name: "name", label: "Имя", placeholder: "Как к вам обращаться" },
  { name: "phone", label: "Телефон", placeholder: "+7..." },
  { name: "city", label: "Город", placeholder: "Город доставки" },
  { name: "street", label: "Улица", placeholder: "Название улицы" },
  { name: "house", label: "Дом", placeholder: "Дом" },
  { name: "flat", label: "Квартира", placeholder: "Квартира" }
];

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const { totalKopecks } = useCartTotals();
  const [accepted, setAccepted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const canPay = items.length > 0 && accepted;

  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">оформление</p>
        <h1 className="mt-2 text-3xl font-black text-white">Куда доставить заказ?</h1>
      </section>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center">
          <h2 className="text-xl font-black text-white">Сначала добавьте товар</h2>
          <p className="mt-2 text-sm text-white/58">Оформление появится после добавления ночника в корзину.</p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white"
          >
            В каталог
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-5 grid gap-3">
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-2 block text-sm font-bold text-white/78">{field.label}</span>
                <input
                  className="h-13 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-white/34 focus:border-neon-cyan/50 focus:shadow-glow"
                  placeholder={field.placeholder}
                />
              </label>
            ))}
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-white/78">Комментарий к заказу</span>
              <textarea
                className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition placeholder:text-white/34 focus:border-neon-cyan/50 focus:shadow-glow"
                placeholder="Например: хочу более холодное свечение"
              />
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/7 p-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 accent-neon-cyan"
              />
              <span className="text-sm leading-5 text-white/66">
                Согласен на обработку данных для демонстрационного оформления заказа.
              </span>
            </label>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
            <h2 className="text-lg font-black text-white">Состав заказа</h2>
            <div className="mt-3 grid gap-3">
              {items.map((item) => (
                <div key={item.lineId} className="flex justify-between gap-4 text-sm">
                  <span className="text-white/66">
                    {item.productName} x {item.quantity}
                    <span className="block text-xs text-white/42">{item.itemTypeLabel}, {item.sizeLabel}</span>
                    {item.note ? (
                      <span className="mt-1 block text-xs font-semibold text-neon-cyan">{item.note}</span>
                    ) : null}
                  </span>
                  <span className="font-bold text-white">{formatKopecks(item.unitPriceKopecks * item.quantity)} ₽</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-white/58">Итого</span>
              <span className="text-2xl font-black text-white">{formatKopecks(totalKopecks)} ₽</span>
            </div>
            <ActionButton className="mt-4 w-full" disabled={!canPay} onClick={() => setShowDemo(true)}>
              Перейти к оплате
            </ActionButton>
          </section>
        </>
      )}

      <AnimatePresence>
        {showDemo ? (
          <motion.div
            className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-xl rounded-[24px] border border-neon-cyan/30 bg-[#08111a] p-4 shadow-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex gap-3">
              <CheckCircle2 className="shrink-0 text-neon-cyan" size={24} />
              <div>
                <p className="font-black text-white">Демо-режим</p>
                <p className="mt-1 text-sm leading-5 text-white/66">
                  Демо-режим: подключение оплаты будет добавлено на следующем этапе
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
