import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, cookiesStore, verifyPassword, createAdminSessionToken, requireAdminSession } = vi.hoisted(() => ({
      db: { select: vi.fn() },
  cookiesStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
  verifyPassword: vi.fn(),
  createAdminSessionToken: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/db", () => ({ getDb: () => db }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  ADMIN_SESSION_COOKIE_NAME: "admin_session",
  ADMIN_SESSION_COOKIE_OPTIONS: { httpOnly: true, sameSite: "lax", secure: false, path: "/" },
  createAdminSessionToken,
  requireAdminSession,
  verifyPassword,
}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookiesStore) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));

import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import AdminLayout from "@/app/(admin)/admin/layout";
import AdminPage from "@/app/(admin)/admin/page";

function request(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin authentication routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyPassword.mockResolvedValue(true);
    createAdminSessionToken.mockReturnValue("session-token");
    db.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValue([{ id: "user-1", partnerId: "partner-1", passwordHash: "hash", role: "admin" }]),
        }),
      }),
    });
  });

  it("creates an admin session for valid credentials", async () => {
    const response = await login(request({ email: " Admin@Example.com ", password: "secret" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(verifyPassword).toHaveBeenCalledWith("secret", "hash");
    expect(response.headers.get("set-cookie")).toContain("admin_session=session-token");
  });

  it("rejects invalid payloads", async () => {
    const response = await login(request({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid request" });
  });

  it("uses the same unauthorized response for wrong passwords and unknown emails", async () => {
    verifyPassword.mockResolvedValue(false);
    const wrongPassword = await login(request({ email: "admin@example.com", password: "wrong" }));
    db.select.mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([]) }) }) });
    const unknownEmail = await login(request({ email: "missing@example.com", password: "wrong" }));

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual({ error: "Invalid credentials" });
    expect(await unknownEmail.json()).toEqual({ error: "Invalid credentials" });
  });

  it("rejects oversized credentials before querying or verifying", async () => {
    const longEmail = `${"a".repeat(321)}@example.com`;
    const longPassword = "p".repeat(257);

    const longEmailResponse = await login(request({ email: longEmail, password: "secret" }));
    const longPasswordResponse = await login(request({ email: "admin@example.com", password: longPassword }));

    expect(longEmailResponse.status).toBe(400);
    expect(longPasswordResponse.status).toBe(400);
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(db.select).not.toHaveBeenCalled();
  });

  it.each(["customer", "manager"])("rejects non-admin role %s", async (role) => {
    db.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValue([{ id: "user-1", partnerId: "partner-1", passwordHash: "hash", role }]),
        }),
      }),
    });

    const response = await login(request({ email: "user@example.com", password: "secret" }));

    expect(response.status).toBe(401);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("allows logout to be repeated", async () => {
    const first = await logout();
    const second = await logout();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.get("set-cookie")).toContain("admin_session=");
    expect(second.headers.get("set-cookie")).toContain("admin_session=");
  });
});

describe("admin area protection", () => {
  it("redirects unauthenticated visitors to login", async () => {
    requireAdminSession.mockRejectedValue(new Error("invalid"));

    await expect(AdminLayout({ children: "content" })).rejects.toThrow("REDIRECT:/login");
  });

  it("renders the authenticated home dashboard", async () => {
    requireAdminSession.mockResolvedValue({ userId: "user-1", partnerId: "partner-1" });

    const layout = await AdminLayout({ children: "content" });
    const page = await AdminPage();

    expect(layout).toBeTruthy();
    expect(page).toBeTruthy();
    expect(JSON.stringify(page)).toContain("Olá, seja bem-vindo!");
  });
});
