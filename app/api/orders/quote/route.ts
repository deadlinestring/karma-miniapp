import { NextResponse } from "next/server";
import { OrderQuoteError, quoteOrder } from "@/lib/server/order-quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await readJsonBody(request);
    const quote = await quoteOrder(payload);

    return NextResponse.json({ ok: true, ...quote });
  } catch (error) {
    if (error instanceof OrderQuoteError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, message: "Не удалось рассчитать заказ. Попробуйте позже." },
      { status: 500 }
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new OrderQuoteError("Передайте данные корзины.");
  }
}
