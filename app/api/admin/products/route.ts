import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { createAdminProduct, getAdminProducts } from "@/lib/server/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await getAdminProducts({
      search: searchParams.get("search"),
      categoryId: searchParams.get("categoryId"),
      subcategoryId: searchParams.get("subcategoryId"),
      status: searchParams.get("status") as "all" | "active" | "hidden" | "featured" | null,
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize")
    });

    return NextResponse.json({ ok: true, products: result.items, ...result });
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
    const product = await createAdminProduct(payload);
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json(productErrorResponse(error), { status: productErrorStatus(error) });
  }
}

function productErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "product_slug_exists") {
    return { ok: false, message: "Товар с таким служебным адресом уже существует" };
  }

  return { ok: false };
}

function productErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  return error.message === "product_slug_exists" ? 409 : 400;
}
