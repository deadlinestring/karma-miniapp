import type { Product } from "@/lib/products";

const accentClasses = {
  violet: "from-neon-violet/80 via-neon-blue/35 to-neon-pink/55 shadow-violet",
  cyan: "from-neon-cyan/75 via-neon-blue/35 to-neon-violet/55 shadow-glow",
  blue: "from-neon-blue/80 via-neon-cyan/30 to-neon-violet/55 shadow-glow",
  pink: "from-neon-pink/75 via-neon-violet/40 to-neon-cyan/45 shadow-violet"
};

export function ProductVisual({
  product,
  compact = false
}: {
  product: Pick<Product, "title" | "accent" | "motif">;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-white/10 bg-graphite ${
        compact ? "h-36" : "h-72"
      } ${accentClasses[product.accent]}`}
      aria-label={`Визуальная обложка товара ${product.title}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
      <div className="absolute -left-8 top-8 h-36 w-36 rounded-full bg-neon-violet/30 blur-3xl" />
      <div className="absolute -right-6 bottom-5 h-32 w-32 rounded-full bg-neon-cyan/30 blur-3xl" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <div className="absolute inset-x-10 bottom-10 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/28 text-center text-xs font-semibold uppercase tracking-[0.22em] text-white/82 shadow-[0_0_55px_rgba(49,246,255,0.22)]">
        {product.motif}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">KARMA light</p>
        <p className="mt-1 line-clamp-1 text-lg font-black text-white">{product.title}</p>
      </div>
    </div>
  );
}
