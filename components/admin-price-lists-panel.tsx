"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";
import { groupPriceListItems } from "@/lib/admin-price-list-groups";
import type { StorefrontItemType } from "@/lib/storefront-types";

type AdminPriceListItem = {
  id: string;
  itemType: StorefrontItemType;
  itemTypeLabel: string;
  sizeCm: number;
  priceKopecks: number;
  priceRubles: number;
  note: string | null;
  sortOrder: number;
  isActive: boolean;
};

type AdminPriceList = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  items: AdminPriceListItem[];
};

export function AdminPriceListsPanel({ initData }: { initData: string }) {
  const [priceList, setPriceList] = useState<AdminPriceList | null>(null);
  const [draft, setDraft] = useState<Record<string, { priceRubles: string; note: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useScrollIntoViewOnChange(message ?? error);

  useEffect(() => {
    let isMounted = true;

    loadPriceList(initData)
      .then((data) => {
        if (isMounted) {
          setPriceList(data);
          setDraft(toDraft(data.items));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить прайс-лист.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  const groups = useMemo(() => groupPriceListItems(priceList?.items ?? []), [priceList?.items]);

  function updateDraft(id: string, field: "priceRubles" | "note", value: string) {
    setDraft((current) => ({
      ...current,
      [id]: {
        priceRubles: current[id]?.priceRubles ?? "",
        note: current[id]?.note ?? "",
        [field]: value
      }
    }));
  }

  async function savePrices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!priceList) {
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const items = priceList.items.map((item) => {
        const priceRubles = Number(draft[item.id]?.priceRubles);

        return {
          id: item.id,
          priceRubles,
          note: draft[item.id]?.note.trim() || null
        };
      });

      const response = await fetch("/api/admin/price-lists/main", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error("price_list_save_failed");
      }

      const data = (await response.json()) as { priceList: AdminPriceList };
      setPriceList(data.priceList);
      setDraft(toDraft(data.priceList.items));
      setMessage("Цены сохранены.");
    } catch {
      setError("Не удалось сохранить прайс-лист.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-white/64">Загружаем основной прайс...</p>;
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">price lists</p>
        <h2 className="mt-2 text-xl font-black text-white">{priceList?.name ?? "Основной прайс KARMA"}</h2>
        <p className="mt-3 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-3 text-sm leading-6 text-neon-cyan">
          Изменения применяются ко всем товарам, использующим этот прайс.
        </p>
      </div>

      <div ref={statusRef}>
        {message ? <p className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      <form onSubmit={savePrices} className="mt-5 grid gap-4">
        {groups.map((group) => (
          <div key={group.itemType} className="rounded-3xl border border-white/10 bg-night/60 p-4">
            <h3 className="text-lg font-black text-white">{group.label}</h3>
            <div className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/7 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-white">{item.sizeCm} см</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        value={draft[item.id]?.priceRubles ?? ""}
                        onChange={(event) => updateDraft(item.id, "priceRubles", event.target.value)}
                        className="h-11 w-28 rounded-2xl border border-white/10 bg-night/70 px-3 text-right text-sm font-black text-white outline-none focus:border-neon-cyan/60"
                      />
                      <span className="text-sm font-bold text-white/58">₽</span>
                    </label>
                  </div>
                  <textarea
                    value={draft[item.id]?.note ?? ""}
                    onChange={(event) => updateDraft(item.id, "note", event.target.value)}
                    maxLength={160}
                    rows={2}
                    placeholder="Примечание для покупателя"
                    className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-night/70 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32 focus:border-neon-cyan/60"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving || !priceList}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-night transition disabled:opacity-60"
          >
            <Save size={18} />
            Сохранить цены
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-5 text-sm font-black text-white transition hover:bg-white/12"
          >
            Проверить магазин
          </Link>
        </div>
      </form>
    </section>
  );
}

async function loadPriceList(initData: string) {
  const response = await fetch("/api/admin/price-lists/main", {
    headers: { "X-Telegram-Init-Data": initData }
  });

  if (!response.ok) {
    throw new Error("price_list_load_failed");
  }

  const data = (await response.json()) as { priceList: AdminPriceList };
  return data.priceList;
}

function toDraft(items: AdminPriceListItem[]) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        priceRubles: String(item.priceRubles),
        note: item.note ?? ""
      }
    ])
  );
}
