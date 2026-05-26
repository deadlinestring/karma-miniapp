import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminProduct, updateAdminProduct } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    productId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const product = await getAdminProduct(context.params.productId);
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const product = await updateAdminProduct(context.params.productId, payload);
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json(productUpdateErrorResponse(error), { status: 400 });
  }
}

function productUpdateErrorResponse(error: unknown) {
  if (!(error instanceof Error)) {
    return { ok: false };
  }

  const messages: Record<string, string> = {
    cover_required: "Сначала загрузите главную фотографию товара",
    subcategory_inactive: "Выбранная подкатегория скрыта",
    category_inactive: "Родительская категория скрыта",
    price_list_not_ready: "Для товара не назначен активный прайс",
    featured_requires_active_product: "Популярным можно сделать только товар, который показывается в магазине"
  };

  return { ok: false, message: messages[error.message] };
}
