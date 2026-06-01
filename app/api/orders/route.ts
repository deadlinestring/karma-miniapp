import { NextResponse } from "next/server";
import {
  createOrder,
  OrderCreateError,
  TELEGRAM_ORDER_REQUIRED_MESSAGE
} from "@/lib/server/order-create";
import { OrderQuoteError } from "@/lib/server/order-quote";
import { TELEGRAM_INIT_DATA_HEADER } from "@/lib/server/admin-auth";
import { validateTelegramInitData } from "@/lib/server/telegram-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const initData = request.headers.get(TELEGRAM_INIT_DATA_HEADER);
  const telegramAuth = validateTelegramInitData(initData);

  if (!telegramAuth.ok) {
    return NextResponse.json(
      { ok: false, message: TELEGRAM_ORDER_REQUIRED_MESSAGE },
      { status: 401 }
    );
  }

  try {
    const payload = await readJsonBody(request);
    const order = await createOrder(payload, telegramAuth.user);

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    if (error instanceof OrderCreateError || error instanceof OrderQuoteError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, message: "Не удалось создать заказ. Попробуйте позже." },
      { status: 500 }
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new OrderCreateError("Передайте данные заказа.");
  }
}
