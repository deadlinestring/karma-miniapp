import type { HTMLAttributes, ReactNode } from "react";

type SurfaceTone = "default" | "muted" | "info" | "success" | "danger" | "warning" | "mask";

const toneClass: Record<SurfaceTone, string> = {
  default: "border-white/10 bg-[linear-gradient(145deg,rgba(20,10,35,0.88),rgba(8,4,16,0.88))] shadow-[0_16px_44px_rgba(0,0,0,0.28)]",
  muted: "border-neon-violet/18 bg-[linear-gradient(145deg,rgba(18,9,32,0.9),rgba(7,4,14,0.9))] shadow-[0_18px_46px_rgba(0,0,0,0.34)]",
  info: "border-neon-cyan/22 bg-[linear-gradient(145deg,rgba(18,20,42,0.9),rgba(5,18,24,0.84))] shadow-[0_0_24px_rgba(49,246,255,0.08)]",
  success: "border-emerald-300/30 bg-[linear-gradient(145deg,rgba(11,42,36,0.78),rgba(5,17,17,0.88))]",
  danger: "border-red-400/30 bg-[linear-gradient(145deg,rgba(55,16,34,0.78),rgba(20,5,12,0.9))]",
  warning: "border-amber-300/30 bg-[linear-gradient(145deg,rgba(51,36,12,0.78),rgba(18,12,5,0.9))]",
  mask: "border-neon-violet/28 bg-[linear-gradient(145deg,rgba(25,12,45,0.92),rgba(8,4,16,0.9))] shadow-[0_22px_60px_rgba(0,0,0,0.38),0_0_34px_rgba(155,92,255,0.14)] backdrop-blur-xl"
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
    <Component className={`rounded-lg border ${toneClass[tone]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
