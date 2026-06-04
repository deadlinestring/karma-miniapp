import { NextResponse } from "next/server";
import { TELEGRAM_INIT_DATA_HEADER } from "@/lib/server/admin-auth";
import { validateTelegramInitData } from "@/lib/server/telegram-auth";
import { prepareCustomerYooKassaPayment } from "@/lib/server/yookassa-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { publicNumber: string } }) {
  const initData = request.headers.get(TELEGRAM_INIT_DATA_HEADER);
  const telegramAuth = validateTelegramInitData(initData);

  if (!telegramAuth.ok) {
    return NextResponse.json(
      { ok: false, message: "Оплата доступна внутри Telegram Mini App." },
      { status: 401 }
    );
  }

  try {
    const result = await prepareCustomerYooKassaPayment(params.publicNumber, telegramAuth.user);

    if (!result.ok && result.reason === "ORDER_NOT_FOUND") {
      return NextResponse.json({ ok: false, message: "Заказ не найден." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_order_number") {
      return NextResponse.json({ ok: false, message: "Заказ не найден." }, { status: 404 });
    }

    return NextResponse.json(
      { ok: false, message: "Не удалось подготовить оплату. Попробуйте позже." },
      { status: 500 }
    );
  }
}
