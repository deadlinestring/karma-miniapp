import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type UiButtonVariant = "primary" | "secondary" | "ghost";
type UiButtonSize = "sm" | "md";

const baseButtonClass =
  "inline-flex items-center justify-center rounded-2xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night disabled:cursor-not-allowed disabled:opacity-50";

const variantClass: Record<UiButtonVariant, string> = {
  primary: "bg-gradient-to-r from-neon-violet via-neon-blue to-neon-cyan text-white shadow-glow",
  secondary: "border border-white/12 bg-white/8 text-white hover:bg-white/12",
  ghost: "border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/16"
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
