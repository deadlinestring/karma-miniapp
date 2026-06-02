import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { updateAdminOrderFulfillmentStatus } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { publicNumber: string } }) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const order = await updateAdminOrderFulfillmentStatus(params.publicNumber, payload);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(orderStatusErrorResponse(error), { status: orderStatusErrorCode(error) });
  }
}

function orderStatusErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "forbidden_status_transition") {
    return { ok: false, message: "Этот переход статуса пока недоступен." };
  }

  return { ok: false };
}

function orderStatusErrorCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  return error.message === "order_not_found" ? 404 : 400;
}

