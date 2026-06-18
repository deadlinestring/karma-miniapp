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
      className={`overflow-hidden rounded-lg border border-neon-violet/24 bg-[linear-gradient(145deg,#10091c,#05030a)] ${accentClasses[product.accent]}`}
      aria-label={`Визуальная обложка товара ${title}`}
    >
      <div className="relative aspect-[4/5]">
        <Image
          src={image}
          alt={`Обложка товара ${title}`}
          fill
          priority={priority}
          sizes={compact ? "(max-width: 640px) 50vw, 220px" : "(max-width: 640px) 100vw, 560px"}
          className="object-contain object-center p-2 transition duration-150 ease-out group-hover:brightness-[1.04]"
        />
      </div>
      <div className="border-t border-neon-violet/15 bg-[#08030f]/95 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">{product.motif}</p>
        <p className="mt-1 line-clamp-1 text-lg font-black text-white">{title}</p>
      </div>
    </div>
  );
}
