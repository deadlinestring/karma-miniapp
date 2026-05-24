"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

type ActionButtonProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary";
};

export function ActionButton({ className = "", variant = "primary", ...props }: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary"
          ? "bg-gradient-to-r from-neon-violet via-neon-blue to-neon-cyan text-white shadow-glow"
          : "border border-white/12 bg-white/8 text-white hover:bg-white/12"
      } ${className}`}
      {...props}
    />
  );
}
