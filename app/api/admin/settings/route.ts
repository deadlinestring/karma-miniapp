import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { getAdminStoreSettings, updateAdminStoreSettings } from "@/lib/server/admin-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  const settings = await getAdminStoreSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const payload = (await request.json()) as unknown;
    const settings = await updateAdminStoreSettings(payload && typeof payload === "object" ? payload : {});

    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
