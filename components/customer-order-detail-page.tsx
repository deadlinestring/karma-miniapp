"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { renderContentBlockLines, useContentBlocks } from "@/components/use-content-blocks";
import { formatKopecks } from "@/lib/pricing";
import type { StorefrontSettings } from "@/lib/storefront-types";

const SUPPORT_BOT_USERNAME = "karmashopsupportbot";
const orderContentSlugs = ["payment-disabled-guidance", "support-cta"];

type CustomerOrderDetail = {
  publicNumber: string;
  fulfillmentStatus: string;
  fulfillmentStatusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  discountKopecks: number;
  deliveryKopecks: number;
  totalKopecks: number;
  deliveryMethod: string;
  paymentAction: {
    provider: "YOOKASSA";
    providerEnabled: boolean;
    eligible: boolean;
    reason: string;
    message: string;
  };
  customer: {
    name: string;
    phone: string;
    fallbackContact: string | null;
  };
  deliveryAddress: {
    city: string;
    addressLine: string | null;
    street: string;
    house: string;
    apartment: string | null;
    postalCode: string | null;
    comment: string | null;
  } | null;
  comment: string | null;
  items: Array<{
    productName: string;
    itemTypeLabel: string;
    sizeCm: number;
    unitPriceKopecks: number;
    quantity: number;
    lineSubtotalKopecks: number;
    discountKopecks: number;
    lineTotalKopecks: number;
    note: string | null;
    customDrawingStyle: string | null;
    customDrawingSurchargeKopecks: number;
    customImageReviewStatus: string;
  }>;
  createdAt: string;
};

type OrderDetailResponse =
  | { ok: true; order: CustomerOrderDetail }
  | { ok: false; message: string };

type PaymentPrepareResponse =
  | {
      ok: true;
      payment: {
        provider: "YOOKASSA";
        providerEnabled: boolean;
        eligible: boolean;
        confirmationUrl?: string;
        message?: string;
      };
    }
  | { ok: false; message: string };

export function CustomerOrderDetailPage({
  publicNumber,
  settings
}: {
  publicNumber: string;
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  const { getBlock } = useContentBlocks(orderContentSlugs);
  const [initData, setInitData] = useState<string | null>(null);
  const [telegramChecked, setTelegramChecked] = useState(false);
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

    fetch(`/api/orders/${publicNumber}`, {
      headers: { "X-Telegram-Init-Data": initData },
      signal: controller.signal
    })
      .then(async (response) => {
        const body = (await response.json()) as OrderDetailResponse;

        if (!response.ok || !body.ok) {
          throw new Error(body.ok ? "Не удалось загрузить заказ." : body.message);
        }

        setOrder(body.order);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) {
          return;
        }

        setOrder(null);
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заказ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [initData, publicNumber]);

  const supportUrl = order ? buildSupportTelegramUrl(order.publicNumber) : null;
  const paymentAction = order?.paymentAction ?? null;
  const isOrderPaid = order?.paymentStatus === "PAID";
  const paymentDisabledBlock = getBlock("payment-disabled-guidance");
  const supportBlock = getBlock("support-cta");
  const paymentMessageLines =
    paymentAction?.reason === "PROVIDER_DISABLED" && paymentDisabledBlock?.body
      ? renderContentBlockLines(paymentDisabledBlock.body)
      : [];

  function handleSupportClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!supportUrl) {
      return;
    }

    const openTelegramLink = window.Telegram?.WebApp?.openTelegramLink;

    if (openTelegramLink) {
      event.preventDefault();
      openTelegramLink(supportUrl);
    }
  }

  async function handlePaymentClick() {
    if (!initData || !order || !order.paymentAction.providerEnabled || !order.paymentAction.eligible) {
      return;
    }

    setIsPreparingPayment(true);
    setPaymentError(null);

    try {
      const response = await fetch(`/api/orders/${order.publicNumber}/payment/prepare`, {
        method: "POST",
        headers: { "X-Telegram-Init-Data": initData }
      });
      const body = (await response.json()) as PaymentPrepareResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.ok ? "Не удалось подготовить оплату." : body.message);
      }

      if (!body.payment.providerEnabled || !body.payment.eligible || !body.payment.confirmationUrl) {
        throw new Error(body.payment.message ?? "Онлайн-оплата пока недоступна.");
      }

      openPaymentUrl(body.payment.confirmationUrl);
    } catch (prepareError) {
      setPaymentError(
        prepareError instanceof Error ? prepareError.message : "Не удалось подготовить оплату. Попробуйте позже."
      );
    } finally {
      setIsPreparingPayment(false);
    }
  }

  return (
    <AppShell settings={settings}>
      <section>
        <Link href="/orders" className="text-sm font-bold text-neon-cyan">
          ← Мои заказы
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">заказ</p>
        <h1 className="mt-2 text-3xl font-black text-white">{publicNumber}</h1>
      </section>

      {telegramChecked && !initData ? (
        <section className="mt-6 rounded-[24px] border border-amber-300/30 bg-amber-300/10 p-5">
          <h2 className="text-lg font-black text-amber-100">Откройте магазин в Telegram</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">
            Детали заказа доступны внутри Telegram Mini App.
          </p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/7 p-5 text-sm text-white/62">
          Загружаем заказ...
        </section>
      ) : null}

      {error ? (
        <section className="mt-6 rounded-[24px] border border-red-400/30 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
          {error}
        </section>
      ) : null}

      {order ? (
        <div className="mt-6 grid gap-5">
          {paymentAction ? (
            <section className="rounded-[24px] border border-neon-cyan/20 bg-neon-cyan/8 p-4">
              <h2 className="text-lg font-black text-white">Оплата заказа</h2>
              {isOrderPaid ? (
                <div className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-3">
                  <p className="text-sm font-black text-emerald-100">Заказ оплачен</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-50/75">
                    Платёж получен. Дальше менеджер переведёт заказ в работу и будет обновлять статус выполнения.
                  </p>
                </div>
              ) : (
                <div className="mt-2 text-sm leading-6 text-white/66">
                  {paymentAction.reason === "PROVIDER_DISABLED" && paymentDisabledBlock?.title ? (
                    <p className="font-bold text-white/78">{paymentDisabledBlock.title}</p>
                  ) : null}
                  {paymentMessageLines.length > 0 ? (
                    paymentMessageLines.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>{paymentAction.message}</p>
                  )}
                </div>
              )}
              {paymentError ? (
                <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
                  {paymentError}
                </p>
              ) : null}
              {isOrderPaid ? null : paymentAction.providerEnabled && paymentAction.eligible ? (
                <button
                  type="button"
                  disabled={isPreparingPayment}
                  onClick={handlePaymentClick}
                  className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-neon-cyan/35 bg-neon-cyan/15 px-4 text-sm font-bold text-neon-cyan transition hover:bg-neon-cyan/22 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPreparingPayment ? "Готовим оплату..." : "Перейти к оплате"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-bold text-white/45"
                >
                  Оплата скоро
                </button>
              )}
            </section>
          ) : null}

          <section className="rounded-[24px] border border-white/10 bg-white/7 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusBlock label="Статус" value={order.fulfillmentStatusLabel} />
              <StatusBlock label="Оплата" value={order.paymentStatusLabel} />
            </div>
            <p className="mt-4 text-xs text-white/46">{formatDate(order.createdAt)}</p>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/7 p-4">
            <h2 className="text-lg font-black text-white">Состав заказа</h2>
            <div className="mt-4 grid gap-4">
              {order.items.map((item, index) => (
                <div key={`${item.productName}-${index}`} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white">{item.productName}</h3>
                      <p className="mt-1 text-sm text-white/54">
                        {item.itemTypeLabel}, {item.sizeCm} см · {item.quantity} шт.
                      </p>
                      {item.note ? <p className="mt-1 text-xs font-semibold text-neon-cyan">{item.note}</p> : null}
                      {item.customDrawingStyle ? (
                        <p className="mt-1 text-xs text-white/48">
                          Отрисовка: {item.customDrawingStyle}; review: {item.customImageReviewStatus}
                        </p>
                      ) : null}
                    </div>
                    <span className="font-black text-white">{formatKopecks(item.lineTotalKopecks)} ₽</span>
                  </div>
                  {item.discountKopecks > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-200">
                      Скидка: -{formatKopecks(item.discountKopecks)} ₽
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/7 p-4">
            <h2 className="text-lg font-black text-white">Итог</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <SummaryRow label="Товары" value={order.itemsSubtotalKopecks} />
              <SummaryRow label="Отрисовка" value={order.customDrawingKopecks} />
              <SummaryRow label="Скидка" value={-order.discountKopecks} />
              <SummaryRow label="Доставка" value={order.deliveryKopecks} />
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-white/58">Итого</span>
                <span className="text-2xl font-black text-white">{formatKopecks(order.totalKopecks)} ₽</span>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/7 p-4">
            <h2 className="text-lg font-black text-white">Доставка и контакт</h2>
            <div className="mt-3 grid gap-2 text-sm text-white/64">
              {order.deliveryAddress ? (
                <>
                  <p>{order.deliveryAddress.addressLine ?? formatAddress(order.deliveryAddress)}</p>
                  {order.deliveryAddress.comment ? <p>{order.deliveryAddress.comment}</p> : null}
                </>
              ) : (
                <p>Адрес сохранён в заказе.</p>
              )}
              <p>{order.customer.name}</p>
              <p>{order.customer.phone}</p>
              {order.customer.fallbackContact ? <p>{order.customer.fallbackContact}</p> : null}
              {order.comment ? <p>Комментарий: {order.comment}</p> : null}
            </div>
          </section>

          {supportBlock ? (
            <section className="rounded-[24px] border border-neon-cyan/20 bg-neon-cyan/8 p-4">
              <h2 className="text-lg font-black text-white">{supportBlock.title ?? "Нужно изменить заказ?"}</h2>
              <div className="mt-2 grid gap-2 text-sm leading-6 text-white/64">
                {(renderContentBlockLines(supportBlock.body).length > 0
                  ? renderContentBlockLines(supportBlock.body)
                  : [`Напишите нам по заказу ${order.publicNumber}. Менеджер ответит в Telegram.`]
                ).map((line) => (
                  <p key={line}>{line.includes("{order}") ? line.replace("{order}", order.publicNumber) : line}</p>
                ))}
              </div>
              <a
                href={supportUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                onClick={handleSupportClick}
                className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-neon-cyan/35 bg-neon-cyan/15 px-4 text-sm font-bold text-neon-cyan transition hover:bg-neon-cyan/22"
              >
                {supportBlock.ctaLabel ?? "Связаться"}
              </a>
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

export function buildSupportTelegramUrl(publicNumber: string) {
  const safeOrderNumber = publicNumber.replace(/-/g, "_");

  return `https://t.me/${SUPPORT_BOT_USERNAME}?start=order_${encodeURIComponent(safeOrderNumber)}`;
}

function openPaymentUrl(url: string) {
  const openLink = window.Telegram?.WebApp?.openLink;

  if (openLink) {
    openLink(url);
    return;
  }

  window.location.assign(url);
}

function StatusBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: number | string; value: number }) {
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

function formatAddress(address: NonNullable<CustomerOrderDetail["deliveryAddress"]>) {
  return [
    address.postalCode,
    address.city,
    `ул. ${address.street}`,
    `д. ${address.house}`,
    address.apartment ? `кв. ${address.apartment}` : null
  ]
    .filter(Boolean)
    .join(", ");
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
