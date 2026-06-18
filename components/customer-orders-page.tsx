"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { UiButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Surface } from "@/components/ui/surface";
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
      <section className="pb-1">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">заказы</p>
        <h1 className="mt-2 text-3xl font-black text-white">Мои заказы</h1>
        {introBlock ? (
          <div className="mt-3 grid gap-1 text-sm leading-6 text-[#cfc5ff]/62">
            {introBlock.title ? <p className="font-bold text-white/72">{introBlock.title}</p> : null}
            {renderContentBlockLines(introBlock.body).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </section>

      {telegramChecked && !initData ? (
        <Surface tone="warning" className="mt-6 p-5">
          <h2 className="text-lg font-black text-amber-100">Откройте магазин в Telegram</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">
            Заказы доступны внутри Telegram Mini App.
          </p>
        </Surface>
      ) : null}

      {isLoading ? (
        <Surface tone="muted" className="mt-6 p-5 text-sm text-white/62">
          Загружаем ваши заказы...
        </Surface>
      ) : null}

      {error ? (
        <Surface tone="danger" className="mt-6 p-5 text-sm font-semibold text-red-100">
          {error}
        </Surface>
      ) : null}

      {!isLoading && initData && !error && orders.length === 0 ? (
        <EmptyState
          className="mt-6"
          showWatermark={false}
          title={emptyBlock?.title}
          bodyLines={emptyBlock?.body ? renderContentBlockLines(emptyBlock.body) : []}
          ctaHref={emptyBlock?.ctaHref}
          ctaLabel={emptyBlock?.ctaLabel}
        />
      ) : null}

      {orders.length > 0 ? (
        <section className="mt-6 grid gap-3 pb-8">
          {orders.map((order) => (
            <Surface as="article" tone="muted" key={order.publicNumber} className="overflow-hidden p-4 transition duration-150 hover:-translate-y-px hover:border-neon-violet/30 hover:brightness-[1.02] motion-reduce:transform-none motion-reduce:transition-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-[11px] font-bold tracking-[0.08em] text-[#b89cff]">
                    {order.publicNumber}
                  </p>
                  <p className="mt-1 text-xs text-white/46">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge tone="info">{order.fulfillmentStatusLabel}</StatusBadge>
                  <StatusBadge>{order.paymentStatusLabel}</StatusBadge>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-white/62">
                <p className="font-bold text-white/76">{order.itemsCount} поз.</p>
                {order.itemSummary.length > 0 ? <p>{order.itemSummary.join(", ")}</p> : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-neon-violet/15 pt-4">
                <span className="text-xl font-black text-white">
                  {formatKopecks(order.totalKopecks)} ₽
                </span>
                <UiButtonLink
                  href={`/orders/${order.publicNumber}`}
                  size="sm"
                  variant="primary"
                  className="min-h-10 shadow-[0_10px_24px_rgba(86,36,180,0.26)]"
                >
                  Открыть
                </UiButtonLink>
              </div>
            </Surface>
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
