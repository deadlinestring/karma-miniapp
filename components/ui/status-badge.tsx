import type { ReactNode } from "react";

type StatusBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<StatusBadgeTone, string> = {
  neutral: "border-white/10 bg-white/6 text-white/64",
  info: "border-neon-cyan/30 bg-neon-cyan/8 text-neon-cyan shadow-[0_0_14px_rgba(49,246,255,0.08)]",
  success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.08)]",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  danger: "border-red-400/30 bg-red-500/10 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.08)]"
};

export function StatusBadge({
  tone = "neutral",
  className = "",
  children
}: {
  tone?: StatusBadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black tracking-[0.02em] ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}
