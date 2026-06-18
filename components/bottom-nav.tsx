"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Home, LayoutGrid, PackageCheck, ShoppingBag } from "lucide-react";
import { useCartTotals } from "@/store/cart-store";

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/catalog", label: "Каталог", icon: LayoutGrid },
  { href: "/faq", label: "FAQ", icon: CircleHelp },
  { href: "/cart", label: "Корзина", icon: ShoppingBag },
  { href: "/orders", label: "Заказы", icon: PackageCheck }
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCartTotals();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 rounded-lg border border-neon-violet/25 bg-[#080310]/94 p-1.5 shadow-[0_-18px_50px_rgba(0,0,0,0.5),0_0_34px_rgba(155,92,255,0.14)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70 ${
                active
                  ? "border-neon-violet/45 bg-[linear-gradient(145deg,rgba(155,92,255,0.3),rgba(49,246,255,0.08))] text-white shadow-[0_0_24px_rgba(155,92,255,0.28),inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "border-transparent text-white/48 hover:border-white/10 hover:bg-white/5 hover:text-white/82"
              }`}
            >
              <span className={`flex h-6 w-8 items-center justify-center rounded-md transition ${active ? "bg-neon-violet/20 text-neon-cyan drop-shadow-[0_0_8px_rgba(49,246,255,0.55)]" : "text-white/48"}`}>
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              </span>
              <span className="max-w-full truncate px-0.5">{item.label}</span>
              {item.href === "/cart" && count > 0 ? (
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full border border-[#080310] bg-neon-pink shadow-[0_0_10px_rgba(255,79,216,0.7)]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
