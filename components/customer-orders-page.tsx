"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { renderContentBlockLines, useContentBlocks } from "@/components/use-content-blocks";
import { formatKopecks } from "@/lib/pricing";
import type { StorefrontSettings } from "@/lib/storefront-types";

type CustomerOrderListItem = {
  publicNumber: string;
  fulfillmentStatusLabel: string;
  paymentStatusLabel: string;
  totalKopecks: number;
  itemsCount: number;
  itemSummary: string[];
  createdAt: string;
};

type OrdersResponse =
  | {
      ok: true;
      orders: {
        items: CustomerOrderListItem[];
        page: number;
        totalPages: number;
        total: number;
      };
    }
  | { ok: false; message: string };

export function CustomerOrdersPage({
  settings
}: {
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  const { getBlock } = useContentBlocks(["orders-intro-help", "orders-empty-state"]);
  const [initData, setInitData] = useState<string | null>(null);
  const [telegramChecked, setTelegramChecked] = useState(false);
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const introBlock = getBlock("orders-intro-help");
  const emptyBlock = getBlock("orders-empty-state");

  useEffect(() => {
    const telegramInitData = window.Telegram?.WebApp?.initData;

    setInitData(telegramInitData || null);
    setTelegramChecked(true);
  }, []);

  useEffect(() => {
    if (!initData) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch("/api/orders", {
      headers: { "X-Telegram-Init-Data": initData },
      signal: controller.signal
    })
      .then(async (response) => {
        const body = (await response.json()) as OrdersResponse;

        if (!response.ok || !body.ok) {
          throw new Error(body.ok ? "Не удалось загрузить заказы." : body.message);
        }

        setOrders(body.orders.items);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) {
          return;
        }

        setOrders([]);
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заказы.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [initData]);

  return (
    <AppShell settings={settings}>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">заказы</p>
        <h1 className="mt-2 text-3xl font-black text-white">Мои заказы</h1>
        {introBlock ? (
          <div className="mt-2 grid gap-1 text-sm leading-6 text-white/58">
            {introBlock.title ? <p className="font-bold text-white/72">{introBlock.title}</p> : null}
            {renderContentBlockLines(introBlock.body).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </section>

      {telegramChecked && !initData ? (
        <section className="mt-6 rounded-[24px] border border-amber-300/30 bg-amber-300/10 p-5">
          <h2 className="text-lg font-black text-amber-100">Откройте магазин в Telegram</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">
            Заказы доступны внутри Telegram Mini App.
          </p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/7 p-5 text-sm text-white/62">
          Загружаем ваши заказы...
        </section>
      ) : null}

      {error ? (
        <section className="mt-6 rounded-[24px] border border-red-400/30 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
          {error}
        </section>
      ) : null}

      {!isLoading && initData && !error && orders.length === 0 ? (
        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center shadow-violet">
          {emptyBlock?.title ? <h2 className="text-xl font-black text-white">{emptyBlock.title}</h2> : null}
          {emptyBlock?.body ? (
            <div className="mt-2 grid gap-1 text-sm leading-6 text-white/60">
              {renderContentBlockLines(emptyBlock.body).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {emptyBlock?.ctaHref && emptyBlock.ctaLabel ? (
            <Link
              href={emptyBlock.ctaHref}
              className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
            >
              {emptyBlock.ctaLabel}
            </Link>
          ) : null}
        </section>
      ) : null}

      {orders.length > 0 ? (
        <section className="mt-6 grid gap-3">
          {orders.map((order) => (
            <article key={order.publicNumber} className="rounded-[24px] border border-white/10 bg-white/7 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-cyan">
                    {order.publicNumber}
                  </p>
                  <h2 className="mt-2 text-lg font-black text-white">
                    {order.fulfillmentStatusLabel}
                  </h2>
                  <p className="mt-1 text-xs text-white/46">{formatDate(order.createdAt)}</p>
                </div>
                <StatusBadge>{order.paymentStatusLabel}</StatusBadge>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-white/62">
                <p>{order.itemsCount} поз.</p>
                {order.itemSummary.length > 0 ? <p>{order.itemSummary.join(", ")}</p> : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xl font-black text-white">
                  {formatKopecks(order.totalKopecks)} ₽
                </span>
                <Link
                  href={`/orders/${order.publicNumber}`}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-4 text-sm font-black text-white shadow-glow"
                >
                  Открыть
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
