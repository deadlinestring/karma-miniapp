"use client";

import { useEffect, useRef } from "react";

export function useScrollIntoViewOnChange<T>(value: T) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!value) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return ref;
}
