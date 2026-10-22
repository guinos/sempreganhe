import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_OPTIONS,
  createAdminSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { findAdminUserByEmail } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isLoginPayload(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const [user] = await findAdminUserByEmail(email);
  if (!user || (user.role !== "owner" && user.role !== "admin") || !(await verifyPassword(body.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken({ userId: user.id, partnerId: user.partnerId }),
    ADMIN_SESSION_COOKIE_OPTIONS,
  );
  return response;
}

function isLoginPayload(value: unknown): value is { email: string; password: string } {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.email === "string" &&
    payload.email.trim().length > 0 &&
    payload.email.length <= 320 &&
    payload.email.includes("@") &&
    typeof payload.password === "string" &&
    payload.password.length > 0 &&
    payload.password.length <= 256
  );
}
