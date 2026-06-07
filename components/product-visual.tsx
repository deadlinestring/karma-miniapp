import Image from "next/image";

const accentClasses = {
  violet: "shadow-[0_0_38px_rgba(155,92,255,0.24)]",
  cyan: "shadow-[0_0_38px_rgba(49,246,255,0.22)]",
  blue: "shadow-[0_0_38px_rgba(52,163,255,0.22)]",
  pink: "shadow-[0_0_38px_rgba(255,79,216,0.22)]"
};

export function ProductVisual({
  product,
  compact = false,
  priority = false
}: {
  product: {
    name?: string;
    title?: string;
    accent: "violet" | "cyan" | "blue" | "pink";
    motif: string;
    coverImage?: string;
  };
  compact?: boolean;
  priority?: boolean;
}) {
  const image = product.coverImage ?? "/images/mock/product-custom.svg";
  const title = product.name ?? product.title ?? "KARMA";

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-neon-violet/24 bg-graphite ring-1 ring-white/5 transition duration-300 group-hover:border-neon-cyan/35 group-hover:ring-neon-cyan/20 ${
        compact ? "aspect-[4/5]" : "aspect-[4/5]"
      } ${accentClasses[product.accent]}`}
      aria-label={`Визуальная обложка товара ${title}`}
    >
      <Image
        src={image}
        alt={`Обложка товара ${title}`}
        fill
        priority={priority}
        sizes={compact ? "(max-width: 640px) 50vw, 220px" : "(max-width: 640px) 100vw, 560px"}
        className="object-cover transition duration-500 ease-out group-hover:scale-[1.045]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/20 to-black/10" />
      <div className="absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">{product.motif}</p>
        <p className="mt-1 line-clamp-1 text-lg font-black text-white">{title}</p>
      </div>
    </div>
  );
}
