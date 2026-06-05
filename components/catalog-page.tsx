"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { renderContentBlockLines, useContentBlocks } from "@/components/use-content-blocks";
import type { StorefrontCatalogData, StorefrontProduct } from "@/lib/storefront-types";

type FilterValue = "Все" | string;
const catalogContentSlugs = ["catalog-intro-help", "catalog-empty-state"];

export function CatalogPage({
  data,
  loadError = false
}: {
  data: StorefrontCatalogData | null;
  loadError?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const productSlug = searchParams.get("product");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue>("Все");
  const [openedProduct, setOpenedProduct] = useState<StorefrontProduct | null>(null);
  const { getBlock } = useContentBlocks(catalogContentSlugs);

  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);
  const products = useMemo(() => data?.products ?? [], [data?.products]);

  useEffect(() => {
    if (initialCategory && categories.some((item) => item.name === initialCategory)) {
      setCategory(initialCategory);
    }
  }, [categories, initialCategory]);

  useEffect(() => {
    if (productSlug) {
      setOpenedProduct(products.find((product) => product.slug === productSlug) ?? null);
    }
  }, [productSlug, products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch = category === "Все" || product.category === category;
      const queryMatch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.subcategory.toLowerCase().includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [category, products, query]);
  const introBlock = getBlock("catalog-intro-help");
  const emptyBlock = getBlock("catalog-empty-state");

  if (loadError || !data) {
    return (
      <AppShell>
        <CatalogLoadError />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">каталог</p>
        {introBlock?.title ? <h1 className="mt-2 text-3xl font-black text-white">{introBlock.title}</h1> : null}
        {introBlock?.body ? (
          <div className="mt-2 grid gap-1 text-sm leading-6 text-white/58">
            {renderContentBlockLines(introBlock.body).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
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

      <section className="mt-5 grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={setOpenedProduct} variant="compact" />
        ))}
        {filteredProducts.length === 0 && emptyBlock ? (
          <EmptyState
            className="col-span-2"
            title={emptyBlock.title}
            bodyLines={emptyBlock.body ? renderContentBlockLines(emptyBlock.body) : []}
          />
        ) : null}
      </section>

      <ProductModal product={openedProduct} onClose={() => setOpenedProduct(null)} />
    </AppShell>
  );
}

function CatalogLoadError() {
  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center shadow-violet">
      <h1 className="text-2xl font-black text-white">Не удалось загрузить каталог</h1>
      <p className="mt-3 text-sm leading-6 text-white/60">Попробуйте обновить страницу чуть позже.</p>
    </div>
  );
}
