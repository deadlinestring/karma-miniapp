import { NextResponse } from "next/server";
import { TELEGRAM_INIT_DATA_HEADER } from "@/lib/server/admin-auth";
import { CustomOrderUploadError, uploadCustomOrderImage } from "@/lib/server/custom-order-upload";
import { validateTelegramInitData } from "@/lib/server/telegram-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const initData = request.headers.get(TELEGRAM_INIT_DATA_HEADER);
  const telegramAuth = validateTelegramInitData(initData);

  if (!telegramAuth.ok) {
    return NextResponse.json(
      { ok: false, message: "Загрузка изображения доступна внутри Telegram Mini App." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Выберите изображение для своего дизайна." },
        { status: 400 }
      );
    }

    const upload = await uploadCustomOrderImage(file, telegramAuth.user);

    return NextResponse.json({ ok: true, upload });
  } catch (error) {
    if (error instanceof CustomOrderUploadError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, message: "Не удалось загрузить изображение. Попробуйте позже." },
      { status: 500 }
    );
  }
}
