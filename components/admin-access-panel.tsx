"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp, ClipboardList, FileSpreadsheet, FolderTree, Home, Package, ShieldCheck, ShieldX, Tags } from "lucide-react";
import { AdminCategoriesPanel } from "@/components/admin-categories-panel";
import { AdminFaqPanel } from "@/components/admin-faq-panel";
import { AdminOrdersPanel } from "@/components/admin-orders-panel";
import { AdminPriceListsPanel } from "@/components/admin-price-lists-panel";
import { AdminProductImportPanel } from "@/components/admin-product-import-panel";
import { AdminProductsPanel } from "@/components/admin-products-panel";
import { AdminSettingsPanel } from "@/components/admin-settings-panel";

type AdminUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

type AdminSection = "home" | "price-lists" | "products" | "categories" | "orders" | "faq" | "import";

type AdminAccessState =
  | { status: "browser" }
  | { status: "loading" }
  | { status: "authorized"; user: AdminUser; initData: string }
  | { status: "forbidden" }
  | { status: "invalid" };

const sections: Array<{
  id: AdminSection;
  title: string;
  description: string;
  icon: typeof Home;
}> = [
  {
    id: "home",
    title: "Главная страница",
    description: "Тексты, логотип и hero-изображение.",
    icon: Home
  },
  {
    id: "price-lists",
    title: "Прайс-листы",
    description: "Основной прайс KARMA: цены и примечания.",
    icon: Tags
  },
  {
    id: "products",
    title: "Товары",
    description: "Карточки товаров, публикация, обложки и галереи.",
    icon: Package
  },
  {
    id: "categories",
    title: "Категории",
    description: "Будущее управление разделами каталога.",
    icon: FolderTree
  },
  {
    id: "orders",
    title: "Заказы",
    description: "Список заказов, детали и статусы выполнения.",
    icon: ClipboardList
  },
  {
    id: "faq",
    title: "FAQ / Как заказать",
    description: "Тексты для покупателей: заказ, доставка, своя картинка.",
    icon: CircleHelp
  },
  {
    id: "import",
    title: "Импорт товаров",
    description: "CSV-шаблон и безопасный предпросмотр метаданных.",
    icon: FileSpreadsheet
  }
];

function getDisplayName(user: AdminUser) {
  if (user.username) {
    return `@${user.username}`;
  }

  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Telegram administrator";
}

export function AdminAccessPanel() {
  const [state, setState] = useState<AdminAccessState>({ status: "loading" });
  const [activeSection, setActiveSection] = useState<AdminSection | null>(null);

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;

    if (!initData) {
      setState({ status: "browser" });
      return;
    }

    let isMounted = true;

    fetch("/api/admin/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    })
      .then(async (response) => {
        if (!isMounted) {
          return;
        }

        if (response.status === 200) {
          const data = (await response.json()) as { user?: AdminUser };
          setState(data.user ? { status: "authorized", user: data.user, initData } : { status: "invalid" });
          return;
        }

        if (response.status === 403) {
          setState({ status: "forbidden" });
          return;
        }

        setState({ status: "invalid" });
      })
      .catch(() => {
        if (isMounted) {
          setState({ status: "invalid" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col px-4 py-8">
      <div className="glass-panel rounded-[28px] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">admin</p>
        <h1 className="mt-3 text-3xl font-black text-white">
          {state.status === "authorized" ? "Панель управления KARMA" : "Панель управления"}
        </h1>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
          {state.status === "loading" ? (
            <p className="text-sm text-white/64">Проверяем доступ...</p>
          ) : null}

          {state.status === "browser" ? (
            <div>
              <ShieldX className="text-neon-pink" size={34} />
              <h2 className="mt-4 text-xl font-black text-white">Откройте приложение через Telegram</h2>
              <p className="mt-2 text-sm leading-6 text-white/64">
                Откройте приложение через Telegram, чтобы подтвердить доступ администратора.
              </p>
            </div>
          ) : null}

          {state.status === "authorized" ? (
            <div>
              <ShieldCheck className="text-neon-cyan" size={34} />
              <h2 className="mt-4 text-xl font-black text-white">Доступ администратора подтвержден</h2>
              <p className="mt-2 text-sm text-white/64">{getDisplayName(state.user)}</p>
            </div>
          ) : null}

          {state.status === "forbidden" ? (
            <div>
              <ShieldX className="text-neon-pink" size={34} />
              <h2 className="mt-4 text-xl font-black text-white">Доступ запрещен</h2>
              <p className="mt-2 text-sm leading-6 text-white/64">
                У вашего Telegram-аккаунта нет доступа к управлению магазином.
              </p>
            </div>
          ) : null}

          {state.status === "invalid" ? (
            <div>
              <ShieldX className="text-neon-pink" size={34} />
              <h2 className="mt-4 text-xl font-black text-white">Не удалось подтвердить доступ</h2>
              <p className="mt-2 text-sm leading-6 text-white/64">
                Закройте приложение и откройте его заново через Telegram.
              </p>
            </div>
          ) : null}
        </div>

        {state.status === "authorized" ? (
          <AdminWorkspace
            activeSection={activeSection}
            initData={state.initData}
            onOpenSection={setActiveSection}
            onBack={() => setActiveSection(null)}
          />
        ) : (
          <Link
            href="/"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-5 text-sm font-black text-white transition hover:bg-white/12"
          >
            Вернуться в магазин
          </Link>
        )}
      </div>
    </section>
  );
}

function AdminWorkspace({
  activeSection,
  initData,
  onOpenSection,
  onBack
}: {
  activeSection: AdminSection | null;
  initData: string;
  onOpenSection: (section: AdminSection) => void;
  onBack: () => void;
}) {
  if (!activeSection) {
    return (
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
        >
          Открыть магазин
        </Link>
        <div className="mt-5 grid gap-3">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onOpenSection(section.id)}
                className="grid grid-cols-[44px_1fr] gap-3 rounded-3xl border border-white/10 bg-white/7 p-4 text-left transition hover:border-neon-cyan/30 hover:bg-white/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-base font-black text-white">{section.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-white/56">{section.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
        <ArrowLeft size={16} />
        К разделам админки
      </button>

      {activeSection === "home" ? <AdminSettingsPanel initData={initData} /> : null}
      {activeSection === "price-lists" ? <AdminPriceListsPanel initData={initData} /> : null}
      {activeSection === "products" ? <AdminProductsPanel initData={initData} /> : null}
      {activeSection === "categories" ? <AdminCategoriesPanel initData={initData} /> : null}
      {activeSection === "orders" ? <AdminOrdersPanel initData={initData} /> : null}
      {activeSection === "faq" ? <AdminFaqPanel initData={initData} /> : null}
      {activeSection === "import" ? <AdminProductImportPanel initData={initData} onOpenProducts={() => onOpenSection("products")} /> : null}
    </div>
  );
}

function AdminPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">coming next</p>
      <h2 className="mt-2 text-xl font-black text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-white/60">{text}</p>
    </section>
  );
}
