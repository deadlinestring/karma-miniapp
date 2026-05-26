import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminMainPriceList, updateAdminMainPriceList } from "@/lib/server/admin-price-lists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const priceList = await getAdminMainPriceList();
    return NextResponse.json({ ok: true, priceList });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const priceList = await updateAdminMainPriceList(
      payload && typeof payload === "object" ? payload : {}
    );

    return NextResponse.json({ ok: true, priceList });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
