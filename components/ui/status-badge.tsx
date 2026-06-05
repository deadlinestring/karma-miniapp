import type { ReactNode } from "react";

type StatusBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<StatusBadgeTone, string> = {
  neutral: "border-white/10 bg-white/8 text-white/70",
  info: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
  success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  danger: "border-red-400/30 bg-red-500/10 text-red-100"
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
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}
