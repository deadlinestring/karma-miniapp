"use client";

import Link from "next/link";
import { Brush, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { categories, popularProducts, products, type Product } from "@/lib/products";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";

export function HomePage() {
  const [openedProduct, setOpenedProduct] = useState<Product | null>(null);
  const customProduct = products.find((product) => product.isCustom);

  return (
    <AppShell>
      <section className="relative min-h-[540px] overflow-hidden rounded-[30px] border border-white/10 bg-white/8 p-6 shadow-violet">
        <Image
          src="/images/mock/hero-night-light.svg"
          alt="Светящийся акриловый ночник KARMA"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 560px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/42 to-black/88" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(49,246,255,0.2),transparent_20rem)]" />
        <div className="relative flex min-h-[492px] flex-col justify-end">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">
            НОЧНИКИ ПО ТВОЕЙ ИДЕЕ
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] text-white">
            Ночник, который сделает комнату твоей
          </h1>
          <p className="mt-4 text-base leading-7 text-white/70">
            Выбери любимого персонажа, автомобиль или создай свой дизайн
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                href="/catalog"
                className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet via-neon-blue to-neon-cyan text-sm font-black text-white shadow-glow"
              >
                Смотреть каталог
              </Link>
            </motion.div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="h-14 rounded-2xl border border-white/12 bg-white/8 text-sm font-black text-white"
              onClick={() => customProduct && setOpenedProduct(customProduct)}
            >
              Свой дизайн
            </motion.button>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-black text-white">Категории</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/catalog?category=${encodeURIComponent(category.name)}`}
              className="neon-border rounded-3xl bg-white/7 p-4 transition hover:bg-white/10"
            >
              <p className="text-lg font-black text-white">{category.name}</p>
              <p className="mt-2 text-xs text-white/52">{category.subcategories.join(" • ")}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-black text-white">Популярное</h2>
          <Link href="/catalog" className="text-sm font-bold text-neon-cyan">
            Все товары
          </Link>
        </div>
        <div className="mt-3 grid gap-4">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={setOpenedProduct} variant="featured" />
          ))}
        </div>
      </section>

      <section className="mt-7 grid gap-3">
        {[
          { icon: Sparkles, title: "Мягкое свечение", text: "Атмосфера без резкого света" },
          { icon: Wand2, title: "Изготовление под заказ", text: "Подберём размер и стиль" },
          { icon: Brush, title: "Свой дизайн по картинке", text: "Фото, арт или идея для макета" }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/7 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neon-cyan/12 text-neon-cyan">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-black text-white">{item.title}</span>
                <span className="text-sm text-white/56">{item.text}</span>
              </span>
            </div>
          );
        })}
      </section>

      <ProductModal product={openedProduct} onClose={() => setOpenedProduct(null)} />
    </AppShell>
  );
}
