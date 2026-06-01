"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ImageUp, Save } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";

type AdminSettings = {
  storeName: string;
  subtitle: string | null;
  heroTitle: string;
  heroSubtitle: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  contactText: string | null;
  deliveryText: string | null;
};

const emptySettings: AdminSettings = {
  storeName: "",
  subtitle: "",
  heroTitle: "",
  heroSubtitle: "",
  logoUrl: null,
  heroImageUrl: null,
  contactText: "",
  deliveryText: ""
};

export function AdminSettingsPanel({ initData }: { initData: string }) {
  const [settings, setSettings] = useState<AdminSettings>(emptySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useScrollIntoViewOnChange(message ?? error);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/settings", {
      headers: { "X-Telegram-Init-Data": initData }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("settings_load_failed");
        }

        return response.json() as Promise<{ settings: AdminSettings }>;
      })
      .then((data) => {
        if (isMounted) {
          setSettings(data.settings);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить настройки.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  function updateField(field: keyof AdminSettings, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function saveTexts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({
          storeName: settings.storeName,
          subtitle: settings.subtitle,
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          contactText: settings.contactText,
          deliveryText: settings.deliveryText
        })
      });

      if (!response.ok) {
        throw new Error("settings_save_failed");
      }

      const data = (await response.json()) as { settings: AdminSettings };
      setSettings(data.settings);
      setMessage("Тексты сохранены.");
    } catch {
      setError("Не удалось сохранить тексты.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(kind: "logo" | "hero") {
    const file = kind === "logo" ? logoFile : heroFile;

    if (!file) {
      setError("Выберите изображение JPG, PNG или WEBP.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);

      const response = await fetch("/api/admin/settings/upload", {
        method: "POST",
        headers: { "X-Telegram-Init-Data": initData },
        body: formData
      });

      if (!response.ok) {
        throw new Error("upload_failed");
      }

      const data = (await response.json()) as { settings: AdminSettings };
      setSettings(data.settings);
      setMessage(kind === "logo" ? "Логотип загружен." : "Hero-изображение загружено.");

      if (kind === "logo") {
        setLogoFile(null);
      } else {
        setHeroFile(null);
      }
    } catch {
      setError("Не удалось загрузить изображение.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-white/64">Загружаем настройки...</p>;
  }

  return (
    <div className="mt-6 space-y-5">
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
      >
        Открыть магазин
      </Link>

      <div ref={statusRef}>
        {message ? <p className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      <form onSubmit={saveTexts} className="rounded-3xl border border-white/10 bg-white/7 p-5">
        <h2 className="text-xl font-black text-white">Оформление главной страницы</h2>
        <div className="mt-5 grid gap-4">
          <AdminInput label="Название магазина" value={settings.storeName} onChange={(value) => updateField("storeName", value)} required />
          <AdminInput label="Подпись под логотипом" value={settings.subtitle ?? ""} onChange={(value) => updateField("subtitle", value)} />
          <AdminInput label="Заголовок hero" value={settings.heroTitle} onChange={(value) => updateField("heroTitle", value)} required />
          <AdminTextarea label="Подзаголовок hero" value={settings.heroSubtitle} onChange={(value) => updateField("heroSubtitle", value)} required />
          <AdminTextarea label="Контактный текст" value={settings.contactText ?? ""} onChange={(value) => updateField("contactText", value)} />
          <AdminTextarea label="Текст доставки" value={settings.deliveryText ?? ""} onChange={(value) => updateField("deliveryText", value)} />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-night transition disabled:opacity-60"
        >
          <Save size={18} />
          Сохранить тексты
        </button>
      </form>

      <ImageUploadCard
        title="Логотип"
        currentUrl={settings.logoUrl}
        emptyText="Логотип пока не загружен"
        file={logoFile}
        onFileChange={setLogoFile}
        onUpload={() => uploadImage("logo")}
        disabled={isSaving}
      />

      <ImageUploadCard
        title="Hero-изображение"
        currentUrl={settings.heroImageUrl}
        emptyText="Hero-изображение пока не загружено"
        file={heroFile}
        onFileChange={setHeroFile}
        onUpload={() => uploadImage("hero")}
        disabled={isSaving}
      />
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-night/70 px-4 text-sm text-white outline-none transition focus:border-neon-cyan/60"
      />
    </label>
  );
}

function AdminTextarea({
  label,
  value,
  onChange,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={3}
        className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-night/70 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan/60"
      />
    </label>
  );
}

function ImageUploadCard({
  title,
  currentUrl,
  emptyText,
  file,
  onFileChange,
  onUpload,
  disabled
}: {
  title: string;
  currentUrl: string | null;
  emptyText: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  disabled: boolean;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/7 p-5">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-night/70">
        {currentUrl ? (
          <img src={currentUrl} alt={title} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center text-sm text-white/48">{emptyText}</div>
        )}
      </div>
      <p className="mt-3 text-xs text-white/48">JPG, PNG или WEBP, до 4 МБ.</p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="mt-4 block w-full text-sm text-white/70 file:mr-4 file:h-10 file:rounded-2xl file:border-0 file:bg-white file:px-4 file:text-sm file:font-black file:text-night"
      />
      <button
        type="button"
        onClick={onUpload}
        disabled={disabled || !file}
        className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 px-5 text-sm font-black text-neon-cyan transition disabled:opacity-50"
      >
        <ImageUp size={18} />
        Загрузить изображение
      </button>
    </section>
  );
}
