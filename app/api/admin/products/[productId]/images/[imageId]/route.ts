import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { deleteAdminProductImage } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    productId: string;
    imageId: string;
  };
};

export async function DELETE(request: Request, context: RouteContext) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const result = await deleteAdminProductImage(context.params.productId, context.params.imageId);
    return NextResponse.json({
      ok: true,
      product: result.product,
      storageCleanupWarning: result.storageCleanupFailed
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
