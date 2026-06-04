import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminContentBlocks, updateAdminContentBlocks } from "@/lib/server/content-blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  const blocks = await getAdminContentBlocks();
  return NextResponse.json({ ok: true, blocks });
}

export async function PATCH(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const blocks = await updateAdminContentBlocks(payload);

    return NextResponse.json({ ok: true, blocks });
  } catch {
    return NextResponse.json({ ok: false, message: "Не удалось сохранить блоки интерфейса." }, { status: 400 });
  }
}
