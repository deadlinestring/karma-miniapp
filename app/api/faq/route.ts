import { NextResponse } from "next/server";
import { getPublicFaqSections } from "@/lib/server/faq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sections = await getPublicFaqSections();

  return NextResponse.json({ ok: true, sections });
}
