import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { setAdminProductCoverImage } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    productId: string;
    imageId: string;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const product = await setAdminProductCoverImage(context.params.productId, context.params.imageId);
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
