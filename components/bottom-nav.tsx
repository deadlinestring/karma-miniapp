"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PackageCheck, ShoppingBag } from "lucide-react";
import { useCartTotals } from "@/store/cart-store";

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/catalog", label: "Каталог", icon: LayoutGrid },
  { href: "/cart", label: "Корзина", icon: ShoppingBag },
  { href: "/orders", label: "Заказы", icon: PackageCheck }
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCartTotals();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-night/90 px-3 pb-3 pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] transition ${
                active
                  ? "bg-white/12 text-neon-cyan shadow-glow"
                  : "text-white/52 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.href === "/cart" && count > 0 ? (
                <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-neon-pink" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
