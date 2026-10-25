import { afterEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({ db: {} as Record<string, unknown> }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/db", () => ({ getDb: () => db }));

import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE_NAME,
  AdminSessionError,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  hashPassword,
  requireAdminSession,
  verifyAdminSessionToken,
  verifyPassword,
} from "./auth";

const AUTH_SECRET = "a".repeat(32);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("admin authentication foundation", () => {
  it("hashes and verifies the correct password", async () => {
    const hash = await hashPassword("correct-password");

    expect(hash).not.toContain("correct-password");
    expect(await verifyPassword("correct-password", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects malformed password hashes", async () => {
    expect(await verifyPassword("password", "not-a-hash")).toBe(false);
  });

  it("creates and verifies a token containing only the session identity and expiry", () => {
    vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
    const token = createAdminSessionToken({ userId: "user-1", partnerId: "partner-1" }, 60);

    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(token).not.toContain(AUTH_SECRET);
    expect(token).not.toContain("password");
    expect(token).not.toContain("hash");
    expect(token).not.toContain("phone");
    expect(verifyAdminSessionToken(token)).toEqual({ userId: "user-1", partnerId: "partner-1" });
  });

  it("rejects an invalid signature", () => {
    vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
    const token = createAdminSessionToken({ userId: "user-1", partnerId: "partner-1" }, 60);
    const [payload] = token.split(".");

    expect(() => verifyAdminSessionToken(`${payload}.invalid`)).toThrow(AdminSessionError);
  });

  it("rejects invalid payloads and expired tokens", () => {
    vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
    const malformedPayload = Buffer.from(JSON.stringify({ userId: "user-1" })).toString("base64url");
    expect(() => verifyAdminSessionToken(`${malformedPayload}.invalid`)).toThrow(AdminSessionError);

    const expiredToken = createAdminSessionToken({ userId: "user-1", partnerId: "partner-1" }, -1);
    expect(() => verifyAdminSessionToken(expiredToken)).toThrow(AdminSessionError);
  });

  it("defines a secure production cookie", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(ADMIN_SESSION_COOKIE_NAME).toBe("admin_session");
    expect(getAdminSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("rejects a missing admin session cookie", async () => {
    vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as Awaited<ReturnType<typeof cookies>>);

    await expect(requireAdminSession()).rejects.toThrow(AdminSessionError);
  });

  it("accepts only an active admin whose partner matches the signed session", async () => {
    vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
    const token = createAdminSessionToken({ userId: "user-1", partnerId: "partner-1" }, 60);
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: token }) } as Awaited<ReturnType<typeof cookies>>);
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "user-1" }]),
    };
    db.select = vi.fn().mockReturnValue(query);

    await expect(requireAdminSession()).resolves.toEqual({ userId: "user-1", partnerId: "partner-1" });
    expect(query.where).toHaveBeenCalledOnce();
  });

  it("rejects a signed session when its user is inactive or belongs to another partner", async () => {
    vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
    const token = createAdminSessionToken({ userId: "user-1", partnerId: "partner-1" }, 60);
    vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: token }) } as Awaited<ReturnType<typeof cookies>>);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });

    await expect(requireAdminSession()).rejects.toThrow(AdminSessionError);
  });
});
