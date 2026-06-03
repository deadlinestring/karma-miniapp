import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminOrderCustomImageSignedUrl } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { publicNumber: string } }) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const image = await getAdminOrderCustomImageSignedUrl(params.publicNumber);
    return NextResponse.json({ ok: true, image });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: customImageErrorCode(error) });
  }
}

function customImageErrorCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  return error.message === "order_not_found" || error.message === "custom_image_not_found" ? 404 : 400;
}
