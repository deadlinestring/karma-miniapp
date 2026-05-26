"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Download, FileSearch } from "lucide-react";

type CategoryTree = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    subcategories: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
  }>;
};

type ImportPreviewRow = {
  rowNumber: number;
  externalId: string;
  name: string;
  categorySlug: string;
  categoryName: string | null;
  subcategorySlug: string;
  subcategoryName: string | null;
  productType: "REGULAR" | "CUSTOM";
  action: "CREATE" | "UPDATE" | "ERROR";
  errors: string[];
  warnings: string[];
};

type ImportPreview = {
  totalRows: number;
  createCount: number;
  updateCount: number;
  errorCount: number;
  rows: ImportPreviewRow[];
};

export function AdminProductImportPanel({ initData }: { initData: string }) {
  const [categories, setCategories] = useState<CategoryTree["categories"]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/categories", {
      headers: { "X-Telegram-Init-Data": initData }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("categories_load_failed");
        }

        return response.json() as Promise<{ categoryTree?: CategoryTree }>;
      })
      .then((data) => {
        if (isMounted) {
          setCategories(data.categoryTree?.categories ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить список категорий.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setMessage(null);
    setError(null);
  }

  async function downloadTemplate() {
    setError(null);

    try {
      const response = await fetch("/api/admin/import/products/template", {
        headers: { "X-Telegram-Init-Data": initData }
      });

      if (!response.ok) {
        throw new Error("template_failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "karma-products-template.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось скачать шаблон.");
    }
  }

  async function previewFile() {
    if (!file) {
      setError("Выберите CSV-файл.");
      return;
    }

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/admin/import/products/preview", {
        method: "POST",
        headers: { "X-Telegram-Init-Data": initData },
        body: formData
      });
      const data = (await response.json().catch(() => ({}))) as { preview?: ImportPreview; message?: string };

      if (!response.ok || !data.preview) {
        throw new Error(data.message ?? "preview_failed");
      }

      setPreview(data.preview);
      setMessage("Предпросмотр готов. Каталог не изменен.");
    } catch {
      setError("Не удалось проверить CSV-файл.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">metadata import</p>
      <h2 className="mt-2 text-xl font-black text-white">Импорт товаров</h2>
      <p className="mt-2 text-sm leading-6 text-white/58">
        Здесь можно подготовить массовое добавление карточек. Товары будут создаваться скрытыми, без фотографий, и получат
        основной прайс. На этом этапе доступен только предпросмотр — база не изменяется.
      </p>

      {message ? <p className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
      {error ? <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}

      <div className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
        <h3 className="text-lg font-black text-white">CSV-шаблон для Excel</h3>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Файл использует UTF-8 с BOM и разделитель `;`, чтобы его было удобно открыть и заполнить в Excel.
        </p>
        <button type="button" onClick={downloadTemplate} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night">
          <Download size={16} />
          Скачать CSV-шаблон
        </button>
        <div className="mt-4 grid gap-2 text-sm text-white/58">
          <p>
            <b className="text-white">external_id</b> — постоянный ID товара.
          </p>
          <p>
            <b className="text-white">name</b> — название.
          </p>
          <p>
            <b className="text-white">description</b> — описание.
          </p>
          <p>
            <b className="text-white">category_slug / subcategory_slug</b> — значения из раздела категорий.
          </p>
          <p>
            <b className="text-white">product_type</b> — `REGULAR` или `CUSTOM`.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
        <h3 className="text-lg font-black text-white">Доступные slug</h3>
        <div className="mt-3 grid gap-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-white/10 bg-white/7 p-3">
              <p className="text-sm font-black text-white">
                {category.name} <span className="font-mono text-xs text-neon-cyan">{category.slug}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {category.subcategories.map((subcategory) => (
                  <span key={subcategory.id} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/62">
                    {subcategory.name}: <span className="font-mono text-neon-cyan">{subcategory.slug}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
        <h3 className="text-lg font-black text-white">Проверка файла</h3>
        <p className="mt-2 text-sm text-white/58">CSV, до 2 МБ, не более 1000 товаров.</p>
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleFileChange}
          className="mt-4 block w-full text-sm text-white/70 file:mr-4 file:h-10 file:rounded-2xl file:border-0 file:bg-white file:px-4 file:text-sm file:font-black file:text-night"
        />
        <button type="button" onClick={previewFile} disabled={isBusy || !file} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-50">
          <FileSearch size={16} />
          Проверить файл
        </button>
      </div>

      {preview ? <PreviewResult preview={preview} /> : null}
    </section>
  );
}

function PreviewResult({ preview }: { preview: ImportPreview }) {
  return (
    <div className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
      <h3 className="text-lg font-black text-white">Результат предпросмотра</h3>
      <p className="mt-2 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">
        Предпросмотр не изменяет каталог. Кнопка применения импорта будет добавлена после проверки шаблона.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Summary label="Строк" value={preview.totalRows} />
        <Summary label="Создать" value={preview.createCount} />
        <Summary label="Обновить" value={preview.updateCount} />
        <Summary label="Ошибок" value={preview.errorCount} />
      </div>
      <div className="mt-4 grid gap-3">
        {preview.rows.map((row) => (
          <div key={`${row.rowNumber}-${row.externalId}`} className="rounded-2xl border border-white/10 bg-white/7 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/70">строка {row.rowNumber}</span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black ${row.action === "ERROR" ? "bg-neon-pink/20 text-neon-pink" : "bg-neon-cyan/15 text-neon-cyan"}`}>
                {row.action}
              </span>
            </div>
            <h4 className="mt-3 text-base font-black text-white">{row.name || "Без названия"}</h4>
            <p className="mt-1 font-mono text-xs text-white/48">{row.externalId || "external_id не указан"}</p>
            <p className="mt-2 text-sm text-white/58">
              {row.categoryName ?? (row.categorySlug || "категория не указана")} /{" "}
              {row.subcategoryName ?? (row.subcategorySlug || "подкатегория не указана")}
            </p>
            {row.errors.length ? <p className="mt-2 text-sm text-neon-pink">{row.errors.join("; ")}</p> : null}
            {row.warnings.length ? <p className="mt-2 text-xs text-white/48">{row.warnings.join("; ")}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
