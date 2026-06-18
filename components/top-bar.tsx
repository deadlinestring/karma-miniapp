"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCartTotals } from "@/store/cart-store";
import type { StorefrontSettings } from "@/lib/storefront-types";

export function TopBar({
  settings
}: {
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  const { count } = useCartTotals();
  const storeName = settings?.storeName || "KARMA";
  const subtitle = settings?.subtitle || "кастомные светильники";

  return (
    <header className="sticky top-0 z-40 border-b border-neon-violet/20 bg-[#05020a]/88 px-4 py-2.5 shadow-[0_14px_36px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70" aria-label="На главную KARMA">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neon-violet/35 bg-[linear-gradient(145deg,rgba(155,92,255,0.22),rgba(49,246,255,0.08))] text-lg font-black shadow-[0_0_24px_rgba(155,92,255,0.22)] transition group-hover:border-neon-cyan/45">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              "K"
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black tracking-[0.14em] text-white drop-shadow-[0_0_14px_rgba(155,92,255,0.28)]">{storeName}</span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#cfc5ff]/55">{subtitle}</span>
          </span>
        </Link>
        <motion.div whileTap={{ scale: 0.92 }}>
          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-neon-violet/30 bg-[linear-gradient(145deg,rgba(24,11,44,0.96),rgba(8,4,16,0.96))] text-white shadow-[0_0_22px_rgba(155,92,255,0.14)] transition hover:border-neon-cyan/45 hover:text-neon-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70"
            aria-label="Открыть корзину"
          >
            <ShoppingBag size={20} />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/20 bg-neon-pink px-1 text-[10px] font-black text-white shadow-[0_0_16px_rgba(255,79,216,0.5)]">
                {count}
              </span>
            ) : null}
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
