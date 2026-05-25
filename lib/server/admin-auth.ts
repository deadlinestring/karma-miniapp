import "server-only";

import { NextResponse } from "next/server";
import { authorizeTelegramAdmin, type TelegramAuthUser } from "@/lib/server/telegram-auth";

export const TELEGRAM_INIT_DATA_HEADER = "x-telegram-init-data";

export type AdminAuthSuccess = {
  ok: true;
  user: TelegramAuthUser;
};

export type AdminAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

export function requireTelegramAdmin(request: Request): AdminAuthResult {
  const initData = request.headers.get(TELEGRAM_INIT_DATA_HEADER);
  const result = authorizeTelegramAdmin(initData);

  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false }, { status: 401 })
    };
  }

  if (!result.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false }, { status: 403 })
    };
  }

  return {
    ok: true,
    user: result.user
  };
}
