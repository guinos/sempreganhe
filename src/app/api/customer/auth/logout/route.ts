import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE_NAME, customerSessionCookieOptions } from "@/lib/customer-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", { ...customerSessionCookieOptions, maxAge: 0 });
  return response;
}
