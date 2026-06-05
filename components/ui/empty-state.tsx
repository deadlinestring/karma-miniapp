import type { ReactNode } from "react";
import { BrandMaskWatermark } from "@/components/ui/brand-mask-watermark";
import { UiButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function EmptyState({
  title,
  bodyLines = [],
  ctaHref,
  ctaLabel,
  visual,
  showWatermark = true,
  className = "",
  children
}: {
  title?: string | null;
  bodyLines?: string[];
  ctaHref?: string | null;
  ctaLabel?: string | null;
  visual?: ReactNode;
  showWatermark?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Surface as="div" tone="mask" className={`relative overflow-hidden p-8 text-center ${className}`}>
      {showWatermark ? (
        <BrandMaskWatermark variant="empty" className="absolute -right-5 -top-5" />
      ) : null}
      <div className="relative">
        {visual ? <div className="flex justify-center">{visual}</div> : null}
        {title ? <h2 className="mt-4 text-xl font-black text-white first:mt-0">{title}</h2> : null}
        {bodyLines.length > 0 ? (
          <div className="mt-2 grid gap-1 text-sm leading-6 text-white/60">
            {bodyLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
        {ctaHref && ctaLabel ? (
          <UiButtonLink href={ctaHref} variant="mask" className="mt-5">
            {ctaLabel}
          </UiButtonLink>
        ) : null}
        {children}
      </div>
    </Surface>
  );
}
