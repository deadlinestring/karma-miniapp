import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type UiButtonVariant = "primary" | "secondary" | "ghost" | "mask";
type UiButtonSize = "sm" | "md";

const baseButtonClass =
  "inline-flex items-center justify-center rounded-xl border font-black tracking-[0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05020a] disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-45";

const variantClass: Record<UiButtonVariant, string> = {
  primary: "border-neon-violet/45 bg-[linear-gradient(100deg,#7f32ff_0%,#a83cff_52%,#5d7cff_100%)] text-white shadow-[0_12px_30px_rgba(86,36,180,0.34),0_0_24px_rgba(155,92,255,0.24)] hover:border-neon-cyan/45 hover:brightness-110",
  secondary: "border-white/12 bg-[linear-gradient(145deg,rgba(24,12,42,0.92),rgba(8,4,16,0.9))] text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-neon-violet/40 hover:bg-neon-violet/10",
  ghost: "border-neon-cyan/25 bg-neon-cyan/6 text-neon-cyan shadow-[0_0_18px_rgba(49,246,255,0.08)] hover:border-neon-cyan/45 hover:bg-neon-cyan/10",
  mask: "border-neon-pink/35 bg-[linear-gradient(105deg,rgba(126,46,255,0.95),rgba(204,52,255,0.9))] text-white shadow-[0_12px_32px_rgba(83,24,152,0.36),0_0_28px_rgba(255,79,216,0.2)] hover:border-neon-cyan/40 hover:brightness-110"
};

const sizeClass: Record<UiButtonSize, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-sm"
};

export function uiButtonClassName({
  variant = "primary",
  size = "md",
  className = ""
}: {
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  className?: string;
} = {}) {
  return [baseButtonClass, variantClass[variant], sizeClass[size], className].filter(Boolean).join(" ");
}

export function UiButton({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: UiButtonVariant;
  size?: UiButtonSize;
}) {
  return <button type={type} className={uiButtonClassName({ variant, size, className })} {...props} />;
}

export function UiButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children
}: {
  href: string;
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={uiButtonClassName({ variant, size, className })}>
      {children}
    </Link>
  );
}
