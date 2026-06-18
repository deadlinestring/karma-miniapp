import Image from "next/image";

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
      className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_50%_42%,rgba(155,92,255,0.12),transparent_45%),linear-gradient(145deg,#10091c,#05030a)]"
      aria-label={`Визуальная обложка товара ${title}`}
    >
      <Image
        src={image}
        alt={`Обложка товара ${title}`}
        fill
        priority={priority}
        sizes={compact ? "(max-width: 640px) 50vw, 220px" : "(max-width: 640px) 100vw, 560px"}
        className="object-contain object-center p-3 transition duration-150 ease-out group-hover:brightness-[1.04]"
      />
    </div>
  );
}
