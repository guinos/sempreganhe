import "server-only";

import { cookies } from "next/headers";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getAuthSecret } from "./env";

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export const ADMIN_SESSION_COOKIE_OPTIONS = getAdminSessionCookieOptions();

export class AdminSessionError extends Error {
  constructor() {
    super("Invalid admin session");
    this.name = "AdminSessionError";
  }
}

export type AdminSession = {
  userId: string;
  restaurantId: string;
};

type SessionPayload = AdminSession & { exp: number };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_LENGTH).toString("base64url");
  const derivedKey = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const parts = encodedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  try {
    const expected = Buffer.from(parts[2], "base64url");
    const actual = (await scryptAsync(password, parts[1], expected.length)) as Buffer;
    return expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createAdminSessionToken(session: AdminSession, ttlSeconds = SESSION_TTL_SECONDS): string {
  const payload: SessionPayload = {
    userId: session.userId,
    restaurantId: session.restaurantId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSession {
  const parts = token.split(".");
  if (parts.length !== 2) throw new AdminSessionError();

  const [encodedPayload, encodedSignature] = parts;
  const expectedSignature = Buffer.from(sign(encodedPayload), "base64url");
  const actualSignature = Buffer.from(encodedSignature, "base64url");
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new AdminSessionError();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    throw new AdminSessionError();
  }

  if (!isSessionPayload(payload) || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new AdminSessionError();
  }

  return { userId: payload.userId, restaurantId: payload.restaurantId };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) throw new AdminSessionError();
  return verifyAdminSessionToken(token);
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getAuthSecret()).update(encodedPayload).digest("base64url");
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "exp,restaurantId,userId") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.userId === "string" &&
    payload.userId.length > 0 &&
    typeof payload.restaurantId === "string" &&
    payload.restaurantId.length > 0 &&
    typeof payload.exp === "number" &&
    Number.isInteger(payload.exp) &&
    Number.isSafeInteger(payload.exp)
  );
}
