import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminProducts } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const products = await getAdminProducts();
    return NextResponse.json({ ok: true, products });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
