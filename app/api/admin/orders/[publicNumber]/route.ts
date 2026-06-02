import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminOrder } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { publicNumber: string } }) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const order = await getAdminOrder(params.publicNumber);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: error instanceof Error && error.message === "order_not_found" ? 404 : 400 });
  }
}

