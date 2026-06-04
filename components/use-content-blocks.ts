"use client";

import { useEffect, useMemo, useState } from "react";

export type UiContentBlock = {
  slug: string;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
};

type ContentBlocksResponse =
  | { ok: true; blocks: UiContentBlock[] }
  | { ok: false; message?: string };

export function useContentBlocks(slugs: string[]) {
  const [blocks, setBlocks] = useState<UiContentBlock[]>([]);
  const query = useMemo(() => slugs.join(","), [slugs]);

  useEffect(() => {
    if (!query) {
      setBlocks([]);
      return;
    }

    let isMounted = true;

    fetch(`/api/content-blocks?slugs=${encodeURIComponent(query)}`)
      .then(async (response) => {
        const body = (await response.json()) as ContentBlocksResponse;

        if (!response.ok || !body.ok) {
          throw new Error("content_blocks_load_failed");
        }

        if (isMounted) {
          setBlocks(body.blocks);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBlocks([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  return {
    blocks,
    getBlock: (slug: string) => blocks.find((block) => block.slug === slug) ?? null
  };
}

export function renderContentBlockLines(body: string | null | undefined) {
  return (body ?? "")
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean);
}
