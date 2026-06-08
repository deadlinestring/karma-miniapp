"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function ImageLightbox({
  src,
  alt,
  onClose
}: {
  src: string | null;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, src]);

  if (!src) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/86 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Закрыть просмотр изображения" onClick={onClose} />
      <div className="relative z-10 max-h-full w-full max-w-5xl overflow-hidden rounded-[28px] border border-neon-cyan/25 bg-[#05030b] shadow-[0_0_80px_rgba(49,246,255,0.22)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/62 text-white transition hover:border-neon-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
          aria-label="Закрыть изображение"
        >
          <X size={18} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[86vh] w-full object-contain" draggable={false} />
      </div>
    </div>
  );
}
