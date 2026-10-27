import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getWhatsAppWebhookConfig } from "@/lib/env";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !challenge || token !== getWhatsAppWebhookConfig().verifyToken) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hub-signature-256");
  const body = await request.text();
  const expected = `sha256=${createHmac("sha256", getWhatsAppWebhookConfig().appSecret).update(body).digest("hex")}`;

  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({ received: true });
}
