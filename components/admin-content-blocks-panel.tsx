"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, Save } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";

type AdminContentBlock = {
  id: string;
  slug: string;
  page: string | null;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ContentBlocksResponse =
  | { ok: true; blocks: AdminContentBlock[] }
  | { ok: false; message?: string };

const placementLabels: Record<string, string> = {
  "home-hero-eyebrow": "Главная: верхняя hero-надпись",
  "home-hero-title": "Главная: hero-заголовок",
  "home-hero-subtitle": "Главная: hero-подзаголовок",
  "home-hero-primary-cta": "Главная: основная hero-кнопка",
  "home-hero-secondary-cta": "Главная: кнопка своего дизайна",
  "catalog-intro-help": "Каталог: заголовок/intro",
  "catalog-empty-state": "Каталог: пустая выдача",
  "cart-empty-state": "Корзина: пустое состояние",
  "orders-intro-help": "Мои заказы: пояснение",
  "checkout-delivery-help": "Checkout: подсказка про доставку",
  "checkout-custom-review-help": "Checkout: подсказка про проверку своего дизайна",
  "payment-disabled-guidance": "Заказ: онлайн-оплата выключена",
  "payment-pending-guidance": "Заказ: ожидает оплаты",
  "custom-design-help": "Карточка товара «Свой дизайн»",
  "custom-product-features-help": "Карточка товара: преимущества",
  "custom-upload-requirements-help": "Карточка товара: требования к изображению",
  "support-cta": "Заказ: связь с менеджером",
  "orders-empty-state": "Мои заказы: пустое состояние"
};

export function AdminContentBlocksPanel({ initData }: { initData: string }) {
  const [blocks, setBlocks] = useState<AdminContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useScrollIntoViewOnChange(message ?? error);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/content-blocks", {
      headers: { "X-Telegram-Init-Data": initData }
    })
      .then(async (response) => {
        const body = (await response.json()) as ContentBlocksResponse;

        if (!response.ok || !body.ok) {
          throw new Error("content_blocks_load_failed");
        }

        if (isMounted) {
          setBlocks(body.blocks);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить блоки интерфейса.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  function updateBlock(slug: string, patch: Partial<AdminContentBlock>) {
    setBlocks((current) => current.map((block) => (block.slug === slug ? { ...block, ...patch } : block)));
  }

  async function saveBlocks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/content-blocks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ blocks })
      });
      const body = (await response.json()) as ContentBlocksResponse;

      if (!response.ok || !body.ok) {
        throw new Error("content_blocks_save_failed");
      }

      setBlocks(body.blocks);
      setMessage("Блоки интерфейса сохранены.");
    } catch {
      setError("Не удалось сохранить блоки. Проверьте длину текста, ссылки и порядок.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-white/64">Загружаем блоки интерфейса...</p>;
  }

  return (
    <div className="mt-6 space-y-5">
      <div ref={statusRef}>
        {message ? <p className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      <form onSubmit={saveBlocks} className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/7 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">content blocks</p>
          <h2 className="mt-2 text-xl font-black text-white">Блоки интерфейса</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Короткие help/promo/guidance-блоки хранятся как plain text. HTML не исполняется, а выключенный блок скрывается в публичном UI.
          </p>
        </section>

        {blocks.map((block) => (
          <section key={block.slug} className="rounded-3xl border border-white/10 bg-white/7 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">{block.slug}</p>
                <h3 className="mt-1 text-lg font-black text-white">{block.title || "Без заголовка"}</h3>
                <p className="mt-1 text-xs text-white/44">{placementLabels[block.slug] ?? block.page ?? "Интерфейс"}</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-white/70">
                <input
                  type="checkbox"
                  checked={block.isActive}
                  onChange={(event) => updateBlock(block.slug, { isActive: event.target.checked })}
                  className="h-4 w-4 accent-cyan-300"
                />
                Активен
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Заголовок</span>
                <input
                  value={block.title ?? ""}
                  onChange={(event) => updateBlock(block.slug, { title: event.target.value })}
                  maxLength={120}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Текст</span>
                <textarea
                  value={block.body ?? ""}
                  onChange={(event) => updateBlock(block.slug, { body: event.target.value })}
                  maxLength={2000}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-night/70 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">CTA label</span>
                  <input
                    value={block.ctaLabel ?? ""}
                    onChange={(event) => updateBlock(block.slug, { ctaLabel: event.target.value })}
                    maxLength={80}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">CTA href</span>
                  <input
                    value={block.ctaHref ?? ""}
                    onChange={(event) => updateBlock(block.slug, { ctaHref: event.target.value })}
                    maxLength={240}
                    placeholder="/faq"
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Порядок</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  value={block.sortOrder}
                  onChange={(event) => updateBlock(block.slug, { sortOrder: Number(event.target.value) })}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-night/55 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-neon-cyan">
                <Eye size={14} />
                Preview
              </p>
              {block.title ? <h4 className="mt-2 font-black text-white">{block.title}</h4> : null}
              <div className="mt-2 grid gap-2 text-sm leading-6 text-white/60">
                {renderPlainTextPreview(block.body)}
              </div>
              {block.ctaLabel ? <p className="mt-3 text-xs font-bold text-neon-cyan">{block.ctaLabel}</p> : null}
            </div>
          </section>
        ))}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-night transition disabled:opacity-60"
        >
          <Save size={18} />
          Сохранить блоки
        </button>
      </form>
    </div>
  );
}

function renderPlainTextPreview(content: string | null) {
  const lines = (content ?? "")
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines.map((line) => <p key={line}>{line}</p>) : <p>Текст пока пустой.</p>;
}
