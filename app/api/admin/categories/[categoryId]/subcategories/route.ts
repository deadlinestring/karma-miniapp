import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { createAdminSubcategory } from "@/lib/server/admin-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { categoryId: string } }) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const result = await createAdminSubcategory(params.categoryId, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(subcategoryErrorResponse(error), { status: subcategoryErrorStatus(error) });
  }
}

function subcategoryErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "subcategory_slug_exists") {
    return { ok: false, message: "Подкатегория с таким названием уже существует в этой категории" };
  }

  return { ok: false };
}

function subcategoryErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  return error.message === "subcategory_slug_exists" ? 409 : 400;
}
