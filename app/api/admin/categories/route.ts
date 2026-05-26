import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { createAdminCategory, getAdminCategoryTree } from "@/lib/server/admin-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const categoryTree = await getAdminCategoryTree();
    return NextResponse.json({ ok: true, categoryTree });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const result = await createAdminCategory(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(categoryErrorResponse(error), { status: categoryErrorStatus(error) });
  }
}

function categoryErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "category_slug_exists") {
    return { ok: false, message: "Категория с таким названием уже существует" };
  }

  return { ok: false };
}

function categoryErrorStatus(error: unknown) {
  return error instanceof Error && error.message === "category_slug_exists" ? 409 : 400;
}
