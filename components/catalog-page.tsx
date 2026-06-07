"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";
import { ProductCard } from "@/components/product-card";
import { ProductModal } from "@/components/product-modal";
import { neonMaskEyebrow, neonMaskGradientText, neonMaskHover, neonMaskMutedText } from "@/components/ui/neon-mask-tokens";
import { renderContentBlockLines, useContentBlocks } from "@/components/use-content-blocks";
import type { StorefrontCatalogData, StorefrontProduct, StorefrontSettings } from "@/lib/storefront-types";

type FilterValue = "Все" | string;
const catalogContentSlugs = ["catalog-intro-help", "catalog-empty-state"];

export function CatalogPage({
  data,
  loadError = false,
  settings
}: {
  data: StorefrontCatalogData | null;
  loadError?: boolean;
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
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
      <AppShell settings={settings}>
        <CatalogLoadError />
      </AppShell>
    );
  }

  return (
    <AppShell settings={settings}>
      <Surface tone="mask" className="relative overflow-hidden p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,79,216,0.14),transparent_14rem),radial-gradient(circle_at_90%_18%,rgba(49,246,255,0.12),transparent_15rem)]" />
        <div className="relative">
        <p className={`text-xs tracking-[0.24em] ${neonMaskEyebrow}`}>каталог</p>
        {introBlock?.title ? <h1 className={`mt-2 text-3xl font-black ${neonMaskGradientText}`}>{introBlock.title}</h1> : null}
        {introBlock?.body ? (
          <div className={`mt-3 grid gap-1 text-sm leading-6 ${neonMaskMutedText}`}>
            {renderContentBlockLines(introBlock.body).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
        <div className="mt-5 flex items-center gap-3 rounded-3xl border border-neon-cyan/20 bg-[#05030b]/62 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition focus-within:border-neon-cyan/50 focus-within:shadow-[0_0_28px_rgba(49,246,255,0.12)]">
          <Search size={20} className="text-neon-cyan/70" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/38"
          />
        </div>
        </div>
      </Surface>

      <section className="mt-5">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {(["Все", ...categories.map((item) => item.name)] as FilterValue[]).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              className={`h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${neonMaskHover} ${
                category === item
                  ? "border border-neon-cyan/40 bg-neon-cyan text-night shadow-glow"
                  : "border border-white/10 bg-white/7 text-white/68 hover:text-white"
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
