import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { LinkedProductsError, updateAdminCategory } from "@/lib/server/admin-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { categoryId: string } }) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const result = await updateAdminCategory(params.categoryId, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LinkedProductsError) {
      return NextResponse.json(
        { ok: false, code: "linked_products_confirmation_required", activeProductCount: error.activeProductCount },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
