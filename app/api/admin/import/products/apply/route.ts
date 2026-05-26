import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { applyCreateOnlyProductImportFile } from "@/lib/server/admin-product-import";

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
    const confirmCreateHiddenProducts = formData.get("confirmCreateHiddenProducts") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "Выберите CSV-файл." }, { status: 400 });
    }

    const result = await applyCreateOnlyProductImportFile(file, confirmCreateHiddenProducts);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSafeApplyErrorMessage(error) }, { status: 400 });
  }
}

function getSafeApplyErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "confirm_required") {
    return "Подтвердите создание скрытых товаров.";
  }

  if (code === "import_has_errors") {
    return "Исправьте ошибки в файле перед импортом.";
  }

  if (code === "import_has_updates") {
    return "Обновление существующих товаров пока не поддерживается. Оставьте в файле только новые товары.";
  }

  if (code === "main_price_list_not_ready") {
    return "Основной прайс временно недоступен.";
  }

  return "Не удалось применить импорт. Проверьте CSV и выполните предпросмотр заново.";
}
