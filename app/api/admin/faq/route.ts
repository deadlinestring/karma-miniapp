import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminFaqSections, updateAdminFaqSections } from "@/lib/server/faq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  const sections = await getAdminFaqSections();
  return NextResponse.json({ ok: true, sections });
}

export async function PATCH(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const sections = await updateAdminFaqSections(payload);

    return NextResponse.json({ ok: true, sections });
  } catch {
    return NextResponse.json({ ok: false, message: "Не удалось сохранить FAQ." }, { status: 400 });
  }
}
