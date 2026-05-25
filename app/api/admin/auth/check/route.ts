import { NextResponse } from "next/server";
import { authorizeTelegramAdmin } from "@/lib/server/telegram-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let initData: unknown;

  try {
    const body = (await request.json()) as { initData?: unknown };
    initData = body.initData;
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (typeof initData !== "string" || initData.length === 0) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = authorizeTelegramAdmin(initData);

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!result.isAdmin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: result.user.id,
      username: result.user.username,
      firstName: result.user.firstName,
      lastName: result.user.lastName
    }
  });
}
