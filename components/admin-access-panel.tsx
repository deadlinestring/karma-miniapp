"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { AdminProductImagesPanel } from "@/components/admin-product-images-panel";
import { AdminSettingsPanel } from "@/components/admin-settings-panel";

type AdminUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

type AdminAccessState =
  | { status: "browser" }
  | { status: "loading" }
  | { status: "authorized"; user: AdminUser; initData: string }
  | { status: "forbidden" }
  | { status: "invalid" };

function getDisplayName(user: AdminUser) {
  if (user.username) {
    return `@${user.username}`;
  }

  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Telegram administrator";
}

export function AdminAccessPanel() {
  const [state, setState] = useState<AdminAccessState>({ status: "loading" });

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
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col justify-center px-4 py-8">
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
              <h2 className="mt-4 text-xl font-black text-white">Доступ администратора подтверждён</h2>
              <p className="mt-2 text-sm text-white/64">{getDisplayName(state.user)}</p>
            </div>
          ) : null}

          {state.status === "forbidden" ? (
            <div>
              <ShieldX className="text-neon-pink" size={34} />
              <h2 className="mt-4 text-xl font-black text-white">Доступ запрещён</h2>
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
          <>
            <AdminSettingsPanel initData={state.initData} />
            <AdminProductImagesPanel initData={state.initData} />
          </>
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
