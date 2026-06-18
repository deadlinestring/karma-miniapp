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
      className={`rounded-xl border px-4 py-3 text-sm font-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05020a] disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-45 ${
        variant === "primary"
          ? "border-neon-violet/45 bg-[linear-gradient(100deg,#7f32ff_0%,#a83cff_52%,#5d7cff_100%)] text-white shadow-[0_12px_30px_rgba(86,36,180,0.34),0_0_24px_rgba(155,92,255,0.24)] hover:border-neon-cyan/45 hover:brightness-110"
          : "border-white/12 bg-[linear-gradient(145deg,rgba(24,12,42,0.92),rgba(8,4,16,0.9))] text-white/88 hover:border-neon-violet/40"
      } ${className}`}
      {...props}
    />
  );
}
