import type { HTMLAttributes, ReactNode } from "react";

type SurfaceTone = "default" | "muted" | "info" | "success" | "danger" | "warning" | "mask";

const toneClass: Record<SurfaceTone, string> = {
  default: "border-white/10 bg-white/7",
  muted: "border-white/10 bg-white/7 shadow-violet",
  info: "border-neon-cyan/20 bg-neon-cyan/8",
  success: "border-emerald-300/30 bg-emerald-400/10",
  danger: "border-red-400/30 bg-red-500/10",
  warning: "border-amber-300/30 bg-amber-300/10",
  mask: "border-neon-violet/30 bg-[#090713]/76 shadow-[0_0_44px_rgba(155,92,255,0.18)] backdrop-blur-xl"
};

export function Surface({
  as = "section",
  tone = "default",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  tone?: SurfaceTone;
  children: ReactNode;
}) {
  const Component = as;

  return (
    <Component className={`rounded-[28px] border ${toneClass[tone]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
