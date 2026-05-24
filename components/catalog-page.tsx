"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { categories, products, type CategoryName, type Product } from "@/lib/products";

type FilterValue = "Все" | CategoryName;

export function CatalogPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as CategoryName | null;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue>(
    initialCategory && categories.some((item) => item.name === initialCategory) ? initialCategory : "Все"
  );
  const [openedProduct, setOpenedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch = category === "Все" || product.category === category;
      const queryMatch =
        normalizedQuery.length === 0 ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.subcategory.toLowerCase().includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">каталог</p>
        <h1 className="mt-2 text-3xl font-black text-white">Выбери свет под свою комнату</h1>
        <div className="mt-5 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/8 px-4 py-3">
          <Search size={20} className="text-white/45" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/38"
          />
        </div>
      </section>

      <section className="mt-5">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {(["Все", ...categories.map((item) => item.name)] as FilterValue[]).map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`h-11 shrink-0 rounded-2xl px-4 text-sm font-bold transition ${
                category === item
                  ? "bg-neon-cyan text-night shadow-glow"
                  : "border border-white/10 bg-white/7 text-white/68"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={setOpenedProduct} />
        ))}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/7 p-8 text-center">
            <p className="text-lg font-black text-white">Ничего не найдено</p>
            <p className="mt-2 text-sm text-white/55">Попробуй другой запрос или категорию.</p>
          </div>
        ) : null}
      </section>

      <ProductModal product={openedProduct} onClose={() => setOpenedProduct(null)} />
    </AppShell>
  );
}
