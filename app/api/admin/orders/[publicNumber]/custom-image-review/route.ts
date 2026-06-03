import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { updateAdminOrderCustomImageReview } from "@/lib/server/admin-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { publicNumber: string } }) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const order = await updateAdminOrderCustomImageReview(params.publicNumber, payload);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(customImageReviewErrorResponse(error), { status: customImageReviewErrorCode(error) });
  }
}

function customImageReviewErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "custom_image_reject_reason_required") {
    return { ok: false, message: "Укажите причину отклонения изображения." };
  }

  if (error instanceof Error && error.message === "forbidden_custom_image_review_transition") {
    return { ok: false, message: "Изображение уже проверено. Повторное изменение пока недоступно." };
  }

  return { ok: false };
}

function customImageReviewErrorCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  return error.message === "order_not_found" || error.message === "custom_image_not_found" ? 404 : 400;
}
