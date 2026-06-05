import type { ReactNode } from "react";
import { UiButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function EmptyState({
  title,
  bodyLines = [],
  ctaHref,
  ctaLabel,
  visual,
  className = "",
  children
}: {
  title?: string | null;
  bodyLines?: string[];
  ctaHref?: string | null;
  ctaLabel?: string | null;
  visual?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Surface as="div" tone="muted" className={`p-8 text-center ${className}`}>
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
        <UiButtonLink href={ctaHref} className="mt-5">
          {ctaLabel}
        </UiButtonLink>
      ) : null}
      {children}
    </Surface>
  );
}
