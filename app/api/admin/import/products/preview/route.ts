import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { previewProductImportFile } from "@/lib/server/admin-product-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "Выберите CSV-файл." }, { status: 400 });
    }

    const preview = await previewProductImportFile(file);
    return NextResponse.json({ ok: true, preview });
  } catch {
    return NextResponse.json({ ok: false, message: "Не удалось проверить CSV-файл." }, { status: 400 });
  }
}
