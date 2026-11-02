import { NextResponse } from "next/server";
import { authenticateCustomer, createCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME, customerSessionCookieOptions } from "@/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    const account = await authenticateCustomer(body.email.trim(), body.password);
    if (!account) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, createCustomerSessionToken({ customerAccountId: account.id }), customerSessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
}
