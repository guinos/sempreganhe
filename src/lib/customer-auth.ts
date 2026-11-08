import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "@/db";
import { customerAccounts } from "@/db/schema";
import { getAuthSecret } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const CUSTOMER_SESSION_COOKIE_NAME = "customer_session";
const CUSTOMER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type CustomerSession = { customerAccountId: string; issuedAt: number };
export class CustomerSessionError extends Error {
  constructor() {
    super("Invalid customer session");
    this.name = "CustomerSessionError";
  }
}

export const customerSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function createCustomerSessionToken(session: CustomerSession, ttlSeconds = CUSTOMER_SESSION_TTL_SECONDS) {
  const encoded = Buffer.from(JSON.stringify({ ...session, issuedAt: session.issuedAt ?? Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  return `${encoded}.${createHmac("sha256", getAuthSecret()).update(encoded).digest("base64url")}`;
}

export function verifyCustomerSessionToken(token: string): CustomerSession {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new CustomerSessionError();
  const expected = createHmac("sha256", getAuthSecret()).update(encoded).digest("base64url");
  const expectedBytes = Buffer.from(expected, "utf8");
  const signatureBytes = Buffer.from(signature, "utf8");
  if (expectedBytes.length !== signatureBytes.length || !timingSafeEqual(expectedBytes, signatureBytes)) throw new CustomerSessionError();
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Record<string, unknown>;
    if (Object.keys(payload).sort().join(",") !== "customerAccountId,exp,issuedAt" || typeof payload.customerAccountId !== "string" || typeof payload.exp !== "number" || typeof payload.issuedAt !== "number" || !Number.isSafeInteger(payload.exp) || !Number.isSafeInteger(payload.issuedAt) || payload.exp <= Math.floor(Date.now() / 1000)) throw new CustomerSessionError();
    return { customerAccountId: payload.customerAccountId, issuedAt: payload.issuedAt };
  } catch {
    throw new CustomerSessionError();
  }
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  if (!token) throw new CustomerSessionError();
  const session = verifyCustomerSessionToken(token);
  const [account] = await getDb().select({ id: customerAccounts.id, passwordChangedAt: customerAccounts.passwordChangedAt }).from(customerAccounts).where(and(eq(customerAccounts.id, session.customerAccountId), eq(customerAccounts.active, true))).limit(1);
  if (!account || (account.passwordChangedAt && Math.floor(account.passwordChangedAt.getTime() / 1000) > session.issuedAt)) throw new CustomerSessionError();
  return session;
}

export async function authenticateCustomer(email: string, password: string) {
  const [account] = await getDb().select().from(customerAccounts).where(eq(customerAccounts.email, email.toLowerCase())).limit(1);
  if (!account || !account.active || !(await verifyPassword(password, account.passwordHash))) return null;
  return account;
}

export { hashPassword };
