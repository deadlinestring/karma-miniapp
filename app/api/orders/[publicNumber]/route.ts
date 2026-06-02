import { NextResponse } from "next/server";
import { TELEGRAM_INIT_DATA_HEADER } from "@/lib/server/admin-auth";
import { getCustomerOrder } from "@/lib/server/customer-orders";
import { validateTelegramInitData } from "@/lib/server/telegram-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { publicNumber: string } }
) {
  const initData = request.headers.get(TELEGRAM_INIT_DATA_HEADER);
  const telegramAuth = validateTelegramInitData(initData);

  if (!telegramAuth.ok) {
    return NextResponse.json(
      { ok: false, message: "Заказ доступен внутри Telegram Mini App." },
      { status: 401 }
    );
  }

  try {
    const order = await getCustomerOrder(params.publicNumber, telegramAuth.user);

    if (!order) {
      return NextResponse.json(
        { ok: false, message: "Заказ не найден." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_order_number") {
      return NextResponse.json(
        { ok: false, message: "Заказ не найден." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Не удалось загрузить заказ. Попробуйте позже." },
      { status: 500 }
    );
  }
}
