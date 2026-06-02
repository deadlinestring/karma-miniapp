import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminOrders } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await getAdminOrders({
      status: searchParams.get("status"),
      paymentStatus: searchParams.get("paymentStatus"),
      search: searchParams.get("search"),
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize")
    });

    return NextResponse.json({ ok: true, orders: result.items, ...result });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

