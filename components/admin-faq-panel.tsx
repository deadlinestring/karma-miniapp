"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Save } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";

type AdminFaqSection = {
  id: string;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
};

type FaqResponse =
  | { ok: true; sections: AdminFaqSection[] }
  | { ok: false; message?: string };

export function AdminFaqPanel({ initData }: { initData: string }) {
  const [sections, setSections] = useState<AdminFaqSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useScrollIntoViewOnChange(message ?? error);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/faq", {
      headers: { "X-Telegram-Init-Data": initData }
    })
      .then(async (response) => {
        const body = (await response.json()) as FaqResponse;

        if (!response.ok || !body.ok) {
          throw new Error("faq_load_failed");
        }

        if (isMounted) {
          setSections(body.sections);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить FAQ.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  function updateSection(slug: string, patch: Partial<AdminFaqSection>) {
    setSections((current) =>
      current.map((section) => (section.slug === slug ? { ...section, ...patch } : section))
    );
  }

  async function saveFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/faq", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ sections })
      });
      const body = (await response.json()) as FaqResponse;

      if (!response.ok || !body.ok) {
        throw new Error("faq_save_failed");
      }

      setSections(body.sections);
      setMessage("FAQ сохранён.");
    } catch {
      setError("Не удалось сохранить FAQ. Проверьте заголовки и текст.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-white/64">Загружаем FAQ...</p>;
  }

  return (
    <div className="mt-6 space-y-5">
      <Link
        href="/faq"
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
      >
        Открыть FAQ
      </Link>

      <div ref={statusRef}>
        {message ? <p className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      <form onSubmit={saveFaq} className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/7 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">FAQ / Как заказать</p>
          <h2 className="mt-2 text-xl font-black text-white">Тексты для покупателей</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Текст хранится как plain text. HTML не нужен: строки в preview выводятся безопасно как обычный текст.
          </p>
        </section>

        {sections.map((section) => (
          <section key={section.slug} className="rounded-3xl border border-white/10 bg-white/7 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">{section.slug}</p>
                <h3 className="mt-1 text-lg font-black text-white">{section.title || "Без заголовка"}</h3>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-white/70">
                <input
                  type="checkbox"
                  checked={section.isActive}
                  onChange={(event) => updateSection(section.slug, { isActive: event.target.checked })}
                  className="h-4 w-4 accent-cyan-300"
                />
                Активен
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Заголовок</span>
                <input
                  value={section.title}
                  onChange={(event) => updateSection(section.slug, { title: event.target.value })}
                  required
                  maxLength={120}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Текст</span>
                <textarea
                  value={section.content}
                  onChange={(event) => updateSection(section.slug, { content: event.target.value })}
                  required
                  maxLength={4000}
                  rows={5}
                  className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-night/70 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Порядок</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  value={section.sortOrder}
                  onChange={(event) => updateSection(section.slug, { sortOrder: Number(event.target.value) })}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-night/55 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-neon-cyan">
                <Eye size={14} />
                Preview
              </p>
              <h4 className="mt-2 font-black text-white">{section.title}</h4>
              <div className="mt-2 grid gap-2 text-sm leading-6 text-white/60">
                {renderPreview(section.content)}
              </div>
            </div>
          </section>
        ))}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-night transition disabled:opacity-60"
        >
          <Save size={18} />
          Сохранить FAQ
        </button>
      </form>
    </div>
  );
}

function renderPreview(content: string) {
  const lines = content
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines.map((line) => <p key={line}>{line}</p>) : <p>Текст пока пустой.</p>;
}
