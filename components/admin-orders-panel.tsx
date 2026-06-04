"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";
import { formatKopecks } from "@/lib/pricing";

type FulfillmentStatus =
  | "NEW"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "IN_WORK"
  | "MANUFACTURED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "FAILED";
type CustomImageReviewStatus = "NOT_REQUIRED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

type AdminOrderListItem = {
  publicNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentStatusLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  totalKopecks: number;
  deliveryAmountKopecks: number;
  discountAmountKopecks: number;
  itemsCount: number;
  customerDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

type AdminOrderDetail = AdminOrderListItem & {
  itemsSubtotalKopecks: number;
  customDrawingKopecks: number;
  deliveryMethod: string;
  customer: {
    name: string;
    phone: string;
    fallbackContact: string | null;
    telegramUsername: string | null;
    telegramFirstName: string | null;
    telegramLastName: string | null;
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
  adminNotes: string | null;
  items: Array<{
    productName: string;
    productSlug: string | null;
    priceListItemId: string | null;
    itemType: string;
    itemTypeLabel: string;
    sizeCm: number;
    unitPriceKopecks: number;
    quantity: number;
    lineSubtotalKopecks: number;
    discountKopecks: number;
    lineTotalKopecks: number;
    note: string | null;
    customDrawingSurchargeKopecks: number;
    customDrawingStyle: string | null;
    hasCustomImage: boolean;
    customImageReviewStatus: CustomImageReviewStatus;
    customImageReviewComment: string | null;
  }>;
  notificationSummary: {
    successCount: number;
    failedCount: number;
    lastSentAt: string | null;
  };
  allowedNextStatuses: Array<{ value: FulfillmentStatus; label: string }>;
};

type OrderListResponse = {
  orders: AdminOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ViewState = { mode: "list" } | { mode: "detail"; publicNumber: string };

const statusOptions: Array<{ value: "all" | FulfillmentStatus; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: "NEW", label: "Новые" },
  { value: "IN_WORK", label: "В работе" },
  { value: "MANUFACTURED", label: "Изготовлены" },
  { value: "SHIPPED", label: "Отправлены" },
  { value: "COMPLETED", label: "Завершены" },
  { value: "CANCELLED", label: "Отменены" }
];

export function AdminOrdersPanel({ initData }: { initData: string }) {
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [status, setStatus] = useState<"all" | FulfillmentStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useScrollIntoViewOnChange(message ?? error);

  useEffect(() => {
    if (view.mode !== "list") {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    loadOrders(initData, { status, search, page })
      .then((data) => {
        if (isMounted) {
          setOrders(data.orders);
          setTotalPages(data.totalPages);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить заказы.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData, page, search, status, view.mode]);

  useEffect(() => {
    if (view.mode !== "detail") {
      setOrder(null);
      return;
    }

    let isMounted = true;
    setIsBusy(true);
    loadOrder(initData, view.publicNumber)
      .then((data) => {
        if (isMounted) {
          setOrder(data);
          setIsBusy(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить заказ.");
          setIsBusy(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData, view]);

  function openList() {
    setView({ mode: "list" });
    setOrder(null);
  }

  async function updateStatus(nextStatus: FulfillmentStatus) {
    if (!order) {
      return;
    }

    setIsBusy(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await patchOrderStatus(initData, order.publicNumber, nextStatus);
      setOrder(updated);
      setMessage("Статус заказа обновлён.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить статус.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">orders</p>
        <h2 className="mt-2 text-xl font-black text-white">Заказы</h2>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Просматривайте заказы и меняйте статус выполнения. Статус оплаты на этом этапе только отображается.
        </p>
      </div>

      <div ref={statusRef}>
        {message ? <p className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      {view.mode === "list" ? (
        <OrderListView
          orders={orders}
          status={status}
          search={search}
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onOpen={(publicNumber) => {
            setMessage(null);
            setError(null);
            setView({ mode: "detail", publicNumber });
          }}
          onPageChange={setPage}
        />
      ) : null}

      {view.mode === "detail" && order ? (
        <OrderDetailView
          initData={initData}
          order={order}
          isBusy={isBusy}
          onBack={openList}
          onUpdateStatus={updateStatus}
          onOrderUpdated={setOrder}
          onBusyChange={setIsBusy}
          onMessage={setMessage}
          onError={setError}
        />
      ) : null}
    </section>
  );
}

function OrderListView({
  orders,
  status,
  search,
  page,
  totalPages,
  isLoading,
  onStatusChange,
  onSearchChange,
  onOpen,
  onPageChange
}: {
  orders: AdminOrderListItem[];
  status: "all" | FulfillmentStatus;
  search: string;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onStatusChange: (status: "all" | FulfillmentStatus) => void;
  onSearchChange: (search: string) => void;
  onOpen: (publicNumber: string) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-5">
      <div className="grid gap-3 rounded-3xl border border-white/10 bg-night/60 p-4">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/7 px-3">
          <Search size={16} className="text-white/42" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск по номеру заказа"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32"
          />
        </label>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as "all" | FulfillmentStatus)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? <p className="mt-5 text-sm text-white/56">Загружаем заказы...</p> : null}

      <div className="mt-5 grid gap-3">
        {orders.map((order) => (
          <button key={order.publicNumber} type="button" onClick={() => onOpen(order.publicNumber)} className="rounded-3xl border border-white/10 bg-night/60 p-4 text-left transition hover:border-neon-cyan/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/45">{formatDate(order.createdAt)}</p>
                <h3 className="mt-1 text-lg font-black text-white">{order.publicNumber}</h3>
              </div>
              <StatusBadge>{order.fulfillmentStatusLabel}</StatusBadge>
            </div>
            <p className="mt-3 text-sm text-white/58">
              {order.customerDisplayName} · {order.itemsCount} поз. · {formatKopecks(order.totalKopecks)} ₽
            </p>
            <p className="mt-2 text-xs text-white/42">Оплата: {order.paymentStatusLabel}</p>
            <span className="mt-3 inline-flex rounded-2xl border border-neon-cyan/25 px-3 py-1 text-xs font-bold text-neon-cyan">
              Открыть
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-10 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white disabled:opacity-40">
          Назад
        </button>
        <span className="text-sm text-white/56">
          {page} / {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-10 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white disabled:opacity-40">
          Далее
        </button>
      </div>
    </div>
  );
}

function OrderDetailView({
  initData,
  order,
  isBusy,
  onBack,
  onUpdateStatus,
  onOrderUpdated,
  onBusyChange,
  onMessage,
  onError
}: {
  initData: string;
  order: AdminOrderDetail;
  isBusy: boolean;
  onBack: () => void;
  onUpdateStatus: (status: FulfillmentStatus) => void;
  onOrderUpdated: (order: AdminOrderDetail) => void;
  onBusyChange: (isBusy: boolean) => void;
  onMessage: (message: string | null) => void;
  onError: (message: string | null) => void;
}) {
  const [nextStatus, setNextStatus] = useState<FulfillmentStatus>(order.allowedNextStatuses[0]?.value ?? order.fulfillmentStatus);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const customImageItem = order.items.find((item) => item.hasCustomImage) ?? null;

  useEffect(() => {
    setNextStatus(order.allowedNextStatuses[0]?.value ?? order.fulfillmentStatus);
  }, [order.allowedNextStatuses, order.fulfillmentStatus]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdateStatus(nextStatus);
  }

  async function openCustomImage() {
    onBusyChange(true);
    onMessage(null);
    onError(null);
    try {
      const image = await loadCustomImageSignedUrl(initData, order.publicNumber);
      setCustomImageUrl(image.signedUrl);
      onMessage(`Ссылка на изображение создана на ${image.expiresInSeconds} сек.`);
    } catch (requestError) {
      onError(requestError instanceof Error ? requestError.message : "Не удалось открыть изображение.");
    } finally {
      onBusyChange(false);
    }
  }

  async function reviewCustomImage(status: Extract<CustomImageReviewStatus, "APPROVED" | "REJECTED">) {
    onBusyChange(true);
    onMessage(null);
    onError(null);
    try {
      const updated = await patchCustomImageReview(initData, order.publicNumber, {
        status,
        reason: status === "REJECTED" ? rejectReason : null
      });
      onOrderUpdated(updated);
      setRejectReason("");
      onMessage(status === "APPROVED" ? "Изображение одобрено." : "Изображение отклонено.");
    } catch (requestError) {
      onError(requestError instanceof Error ? requestError.message : "Не удалось сохранить проверку изображения.");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="mt-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
        <ArrowLeft size={16} />
        К списку заказов
      </button>

      <div className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-black text-white">{order.publicNumber}</h3>
          <StatusBadge>{order.fulfillmentStatusLabel}</StatusBadge>
          <StatusBadge>Оплата: {order.paymentStatusLabel}</StatusBadge>
        </div>
        {order.paymentStatus === "PAID" ? (
          <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-3">
            <p className="text-sm font-black text-emerald-100">Оплата получена</p>
            <p className="mt-1 text-xs leading-5 text-emerald-50/75">
              Платёж синхронизирован webhook. Статус выполнения меняется отдельно вручную.
            </p>
          </div>
        ) : null}
        <p className="mt-2 text-xs text-white/42">Создан: {formatDate(order.createdAt)}</p>

        <div className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-white/7 p-3 text-sm">
          <SummaryRow label="Товары" value={order.itemsSubtotalKopecks} />
          <SummaryRow label="Отрисовка" value={order.customDrawingKopecks} />
          <SummaryRow label="Скидка" value={-order.discountAmountKopecks} />
          <SummaryRow label="Доставка" value={order.deliveryAmountKopecks} />
          <div className="flex justify-between pt-2 text-base font-black text-white">
            <span>Итого</span>
            <span>{formatKopecks(order.totalKopecks)} ₽</span>
          </div>
        </div>

        <h4 className="mt-5 text-base font-black text-white">Состав заказа</h4>
        <div className="mt-3 grid gap-3">
          {order.items.map((item) => (
            <div key={`${item.productName}-${item.priceListItemId}-${item.sizeCm}`} className="rounded-2xl border border-white/10 bg-white/7 p-3">
              <p className="font-black text-white">{item.productName}</p>
              <p className="mt-1 text-sm text-white/58">
                {item.itemTypeLabel}, {item.sizeCm} см x {item.quantity}
              </p>
              {item.note ? <p className="mt-1 text-xs font-semibold text-neon-cyan">{item.note}</p> : null}
              <p className="mt-2 text-sm text-white/70">
                {formatKopecks(item.unitPriceKopecks)} ₽ · строка {formatKopecks(item.lineTotalKopecks)} ₽
              </p>
            </div>
          ))}
        </div>

        {customImageItem ? (
          <div className="mt-5 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/8 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-neon-cyan">custom review</p>
            <h4 className="mt-2 text-base font-black text-white">Изображение на проверку</h4>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <p>Товар: {customImageItem.productName}</p>
              {customImageItem.customDrawingStyle ? <p>Стиль: {customDrawingStyleLabel(customImageItem.customDrawingStyle)}</p> : null}
              <p>Доплата: {formatKopecks(customImageItem.customDrawingSurchargeKopecks)} ₽</p>
              <p>Статус: {customImageReviewStatusLabel(customImageItem.customImageReviewStatus)}</p>
              {customImageItem.customImageReviewComment ? <p>Комментарий: {customImageItem.customImageReviewComment}</p> : null}
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={openCustomImage}
              className="mt-4 h-10 rounded-2xl border border-neon-cyan/30 px-4 text-sm font-black text-neon-cyan disabled:opacity-50"
            >
              Посмотреть изображение
            </button>
            {customImageUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-night/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={customImageUrl} alt="Загруженное изображение для проверки" className="max-h-[360px] w-full object-contain" />
              </div>
            ) : null}
            {customImageItem.customImageReviewStatus === "PENDING_REVIEW" ? (
              <div className="mt-4 grid gap-3">
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Причина отклонения, если изображение не подходит"
                  className="w-full rounded-2xl border border-white/10 bg-night px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isBusy} onClick={() => reviewCustomImage("APPROVED")} className="h-10 rounded-2xl bg-neon-cyan px-4 text-sm font-black text-night disabled:opacity-50">
                    Одобрить
                  </button>
                  <button type="button" disabled={isBusy} onClick={() => reviewCustomImage("REJECTED")} className="h-10 rounded-2xl border border-neon-pink/40 px-4 text-sm font-black text-neon-pink disabled:opacity-50">
                    Отклонить
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/45">Повторное изменение результата проверки пока недоступно.</p>
            )}
            <p className="mt-3 text-xs text-white/45">Приватный путь файла не показывается в интерфейсе.</p>
          </div>
        ) : null}

        <InfoBlock title="Контакт">
          <p>{order.customer.name}</p>
          <p>{order.customer.phone}</p>
          {order.customer.fallbackContact ? <p>{order.customer.fallbackContact}</p> : null}
          {order.customer.telegramUsername ? <p>@{order.customer.telegramUsername}</p> : null}
        </InfoBlock>

        <InfoBlock title="Доставка">
          <p>{formatAddress(order.deliveryAddress)}</p>
          {order.deliveryAddress?.comment ? <p className="mt-1 text-white/58">{order.deliveryAddress.comment}</p> : null}
        </InfoBlock>

        {order.comment ? (
          <InfoBlock title="Комментарий">
            <p>{order.comment}</p>
          </InfoBlock>
        ) : null}

        <InfoBlock title="Уведомления">
          <p>Успешных: {order.notificationSummary.successCount}</p>
          <p>Ошибок: {order.notificationSummary.failedCount}</p>
        </InfoBlock>

        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-white/7 p-3">
          <p className="text-sm font-black text-white">Сменить статус выполнения</p>
          {order.allowedNextStatuses.length > 0 ? (
            <>
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as FulfillmentStatus)} className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
                {order.allowedNextStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={isBusy} className="mt-3 h-11 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-50">
                Сохранить статус
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/56">Для этого статуса нет доступных переходов.</p>
          )}
          <p className="mt-2 text-xs text-white/42">Статус оплаты здесь не меняется.</p>
        </form>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/7 p-3 text-sm text-white/70">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-neon-cyan">{title}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-white/64">
      <span>{label}</span>
      <span className={value < 0 ? "font-bold text-emerald-200" : "font-bold text-white"}>
        {value < 0 ? "-" : ""}
        {formatKopecks(Math.abs(value))} ₽
      </span>
    </div>
  );
}

function StatusBadge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/70">{children}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatAddress(address: AdminOrderDetail["deliveryAddress"]) {
  if (!address) {
    return "Адрес не указан";
  }

  return (
    address.addressLine ||
    [
      address.postalCode,
      address.city,
      `ул. ${address.street}`,
      `д. ${address.house}`,
      address.apartment ? `кв. ${address.apartment}` : null
    ]
      .filter(Boolean)
      .join(", ")
  );
}

async function loadOrders(initData: string, filters: { status: string; search: string; page: number }) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: "20", status: filters.status });

  if (filters.search.trim()) params.set("search", filters.search.trim());

  const response = await fetch(`/api/admin/orders?${params.toString()}`, {
    headers: { "X-Telegram-Init-Data": initData }
  });

  if (!response.ok) throw new Error("orders_load_failed");

  return (await response.json()) as OrderListResponse;
}

async function loadOrder(initData: string, publicNumber: string) {
  const response = await fetch(`/api/admin/orders/${publicNumber}`, {
    headers: { "X-Telegram-Init-Data": initData }
  });
  const data = (await response.json().catch(() => ({}))) as { order?: AdminOrderDetail };

  if (!response.ok || !data.order) throw new Error("order_load_failed");

  return data.order;
}

async function patchOrderStatus(initData: string, publicNumber: string, fulfillmentStatus: FulfillmentStatus) {
  const response = await fetch(`/api/admin/orders/${publicNumber}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData },
    body: JSON.stringify({ fulfillmentStatus })
  });
  const data = (await response.json().catch(() => ({}))) as { order?: AdminOrderDetail; message?: string };

  if (!response.ok || !data.order) throw new Error(data.message ?? "Не удалось обновить статус.");

  return data.order;
}

async function loadCustomImageSignedUrl(initData: string, publicNumber: string) {
  const response = await fetch(`/api/admin/orders/${publicNumber}/custom-image`, {
    headers: { "X-Telegram-Init-Data": initData }
  });
  const data = (await response.json().catch(() => ({}))) as {
    image?: { signedUrl: string; expiresInSeconds: number };
    message?: string;
  };

  if (!response.ok || !data.image) throw new Error(data.message ?? "Не удалось открыть изображение.");

  return data.image;
}

async function patchCustomImageReview(
  initData: string,
  publicNumber: string,
  payload: { status: "APPROVED" | "REJECTED"; reason: string | null }
) {
  const response = await fetch(`/api/admin/orders/${publicNumber}/custom-image-review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData },
    body: JSON.stringify(payload)
  });
  const data = (await response.json().catch(() => ({}))) as { order?: AdminOrderDetail; message?: string };

  if (!response.ok || !data.order) throw new Error(data.message ?? "Не удалось сохранить проверку изображения.");

  return data.order;
}

function customImageReviewStatusLabel(status: CustomImageReviewStatus) {
  const labels: Record<CustomImageReviewStatus, string> = {
    NOT_REQUIRED: "Не требуется",
    PENDING_REVIEW: "Ожидает проверки",
    APPROVED: "Одобрено",
    REJECTED: "Отклонено"
  };

  return labels[status];
}

function customDrawingStyleLabel(style: string) {
  const labels: Record<string, string> = {
    CUSTOM_DRAWING_STYLE_1: "Стиль №1",
    CUSTOM_DRAWING_STYLE_2: "Стиль №2",
    CUSTOM_DRAWING_STYLE_3: "Стиль №3"
  };

  return labels[style] ?? style;
}
