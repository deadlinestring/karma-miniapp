import { PRODUCT_IMPORT_TEMPLATE } from "@/lib/server/admin-product-import";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  return new Response(PRODUCT_IMPORT_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="karma-products-template.csv"'
    }
  });
}
