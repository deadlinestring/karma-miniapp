"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCartTotals } from "@/store/cart-store";

export function TopBar() {
  const { count } = useCartTotals();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night/82 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="На главную KARMA">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neon-cyan/30 bg-white/8 text-lg font-black shadow-glow">
            K
          </span>
          <span>
            <span className="block text-lg font-black tracking-[0.16em] text-white">KARMA</span>
            <span className="block text-[11px] text-white/50">кастомные светильники</span>
          </span>
        </Link>
        <motion.div whileTap={{ scale: 0.92 }}>
          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white"
            aria-label="Открыть корзину"
          >
            <ShoppingBag size={20} />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-pink px-1 text-[11px] font-bold text-white shadow-violet">
                {count}
              </span>
            ) : null}
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
