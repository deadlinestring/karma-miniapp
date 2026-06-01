"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ActionButton } from "@/components/action-button";
import { formatKopecks } from "@/lib/pricing";
import { useCartStore, type CartItem } from "@/store/cart-store";

const fields = [
  { name: "name", label: "Имя", placeholder: "Как к вам обращаться" },
  { name: "phone", label: "Телефон", placeholder: "+7..." },
  { name: "city", label: "Город", placeholder: "Город доставки" },
  { name: "street", label: "Улица", placeholder: "Название улицы" },
  { name: "house", label: "Дом", placeholder: "Дом" },
  { name: "flat", label: "Квартира", placeholder: "Квартира" }
];

type QuoteItem = {
  productId: string;
  productName: string;
  itemTypeLabel: string;
  sizeCm: number;
  quantity: number;
  unitPriceKopecks: number;
  lineSubtotalKopecks: number;
  note: string | null;
  customDrawingSurchargeKopecks: number;
  discountKopecks: number;
  lineTotalKopecks: number;
};

type QuoteResponse =
  | {
      ok: true;
      items: QuoteItem[];
      summary: {
        itemsSubtotalKopecks: number;
        customDrawingTotalKopecks: number;
        deliveryMethod: "RUSSIAN_POST";
        deliveryAmountKopecks: number;
        discountAmountKopecks: number;
        totalKopecks: number;
      };
      warnings: string[];
    }
  | { ok: false; message: string };

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const [accepted, setAccepted] = useState(false);
  const [quote, setQuote] = useState<Extract<QuoteResponse, { ok: true }> | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const quotePayload = useMemo(() => buildQuotePayload(items), [items]);

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      setQuoteError(null);
      setIsQuoteLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/orders/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotePayload),
      signal: controller.signal
    })
      .then(async (response) => {
        const body = (await response.json()) as QuoteResponse;

        if (!response.ok || !body.ok) {
          throw new Error(body.ok ? "Не удалось рассчитать заказ." : body.message);
        }

        setQuote(body);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setQuote(null);
        setQuoteError(error instanceof Error ? error.message : "Не удалось рассчитать заказ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsQuoteLoading(false);
        }
      });

    return () => controller.abort();
  }, [items.length, quotePayload]);

  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">оформление</p>
        <h1 className="mt-2 text-3xl font-black text-white">Куда доставить заказ?</h1>
      </section>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center">
          <h2 className="text-xl font-black text-white">Сначала добавьте товар</h2>
          <p className="mt-2 text-sm text-white/58">
            Оформление появится после добавления ночника в корзину.
          </p>
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
                Согласен на обработку данных для оформления заказа.
              </span>
            </label>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
            <h2 className="text-lg font-black text-white">Расчёт заказа</h2>

            {isQuoteLoading ? (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-sm text-white/64">
                Пересчитываем корзину по актуальным ценам...
              </p>
            ) : null}

            {quoteError ? (
              <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
                {quoteError}
              </p>
            ) : null}

            <div className="mt-3 grid gap-3">
              {(quote?.items ?? fallbackQuoteItems(items)).map((item) => (
                <div key={`${item.productId}-${item.itemTypeLabel}-${item.sizeCm}`} className="text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-white/66">
                      {item.productName} x {item.quantity}
                      <span className="block text-xs text-white/42">
                        {item.itemTypeLabel}, {item.sizeCm} см
                      </span>
                      {item.note ? (
                        <span className="mt-1 block text-xs font-semibold text-neon-cyan">
                          {item.note}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-bold text-white">
                      {formatKopecks(item.lineSubtotalKopecks)} ₽
                    </span>
                  </div>
                  {item.customDrawingSurchargeKopecks > 0 ? (
                    <div className="mt-2 flex justify-between text-xs text-neon-cyan">
                      <span>Отрисовка</span>
                      <span>{formatKopecks(item.customDrawingSurchargeKopecks)} ₽</span>
                    </div>
                  ) : null}
                  {item.discountKopecks > 0 ? (
                    <div className="mt-2 flex justify-between text-xs text-emerald-200">
                      <span>Скидка на второй ночник</span>
                      <span>-{formatKopecks(item.discountKopecks)} ₽</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-sm">
              <SummaryRow
                label="Товары"
                value={quote?.summary.itemsSubtotalKopecks ?? localItemsSubtotal(items)}
              />
              <SummaryRow label="Отрисовка" value={quote?.summary.customDrawingTotalKopecks ?? 0} />
              <SummaryRow
                label="Скидка"
                value={quote ? -quote.summary.discountAmountKopecks : 0}
              />
              <SummaryRow
                label="Доставка Почтой России"
                value={quote?.summary.deliveryAmountKopecks ?? 0}
              />
              <div className="flex items-center justify-between pt-2">
                <span className="text-white/58">Итого</span>
                <span className="text-2xl font-black text-white">
                  {formatKopecks(quote?.summary.totalKopecks ?? localItemsSubtotal(items))} ₽
                </span>
              </div>
            </div>

            <ActionButton className="mt-4 w-full" disabled>
              Создание заказа будет подключено следующим этапом
            </ActionButton>
            {!accepted ? (
              <p className="mt-2 text-center text-xs text-white/42">
                Согласие понадобится на этапе создания заказа.
              </p>
            ) : null}
          </section>
        </>
      )}
    </AppShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-white/64">
      <span>{label}</span>
      <span className={value < 0 ? "font-bold text-emerald-200" : "font-bold text-white"}>
        {value < 0 ? "-" : ""}
        {formatKopecks(Math.abs(value))} ₽
      </span>
    </div>
  );
}

function buildQuotePayload(items: CartItem[]) {
  return {
    deliveryMethod: "RUSSIAN_POST",
    items: items.map((item) => ({
      productId: item.productId,
      priceListItemId: item.priceListItemId,
      quantity: item.quantity,
      custom: item.customDrawingStyle
        ? {
            drawingStyle: item.customDrawingStyle,
            customDesignKey: item.customDesignKey ?? null
          }
        : null
    }))
  };
}

function fallbackQuoteItems(items: CartItem[]): QuoteItem[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    itemTypeLabel: item.itemTypeLabel,
    sizeCm: item.sizeCm,
    quantity: item.quantity,
    unitPriceKopecks: item.unitPriceKopecks,
    lineSubtotalKopecks: item.unitPriceKopecks * item.quantity,
    note: item.note,
    customDrawingSurchargeKopecks: 0,
    discountKopecks: 0,
    lineTotalKopecks: item.unitPriceKopecks * item.quantity
  }));
}

function localItemsSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.unitPriceKopecks * item.quantity, 0);
}
