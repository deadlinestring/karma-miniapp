import { NextResponse } from "next/server";
import { getPublicContentBlocks } from "@/lib/server/content-blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const blocks = await getPublicContentBlocks(slugs);

  return NextResponse.json({ ok: true, blocks });
}
