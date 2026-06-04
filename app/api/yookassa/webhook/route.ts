import { NextResponse } from "next/server";
import { getYooKassaWebhookSecret } from "@/lib/server/yookassa-config";
import { processYooKassaWebhook } from "@/lib/server/yookassa-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET_HEADER = "X-Karma-Webhook-Secret";

export async function POST(request: Request) {
  const expectedSecret = readConfiguredWebhookSecret();

  if (!expectedSecret) {
    return NextResponse.json({ ok: false, message: "Webhook is not configured." }, { status: 503 });
  }

  if (!isValidWebhookSecret(request, expectedSecret)) {
    return NextResponse.json({ ok: false, message: "Webhook is not available." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true, action: "ignored", reason: "invalid_json" });
  }

  const result = await processYooKassaWebhook(payload);
  return NextResponse.json(result);
}

function readConfiguredWebhookSecret() {
  try {
    return getYooKassaWebhookSecret();
  } catch {
    return null;
  }
}

function isValidWebhookSecret(request: Request, expectedSecret: string) {
  const url = new URL(request.url);
  const providedSecret = request.headers.get(WEBHOOK_SECRET_HEADER) ?? url.searchParams.get("token");
  return Boolean(providedSecret && providedSecret === expectedSecret);
}
