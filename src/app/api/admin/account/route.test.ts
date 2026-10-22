import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession, getAccount, updateAccountProfile, updateAccountEmail, updateAccountPassword } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getAccount: vi.fn(),
  updateAccountProfile: vi.fn(),
  updateAccountEmail: vi.fn(),
  updateAccountPassword: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAdminSession }));
vi.mock("@/lib/account", () => ({
  getAccount,
  updateAccountProfile,
  updateAccountEmail,
  updateAccountPassword,
  AccountConflictError: class extends Error {},
  AccountNotFoundError: class extends Error {},
  InvalidCurrentPasswordError: class extends Error {},
  accountProfileSchema: { parse: vi.fn((value: unknown) => value) },
  accountEmailSchema: { parse: vi.fn((value: unknown) => value) },
  accountPasswordSchema: { parse: vi.fn((value: unknown) => value) },
}));

import { GET, PATCH, POST, PUT } from "./route";

const session = { userId: "user-1", partnerId: "partner-1" };
const account = { id: "user-1", partnerId: "partner-1", name: "Ana", email: "ana@example.com", passwordHash: "secret", role: "admin" };

function request(body: unknown) {
  return new Request("http://localhost/api/admin/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue(session);
  getAccount.mockResolvedValue(account);
  updateAccountProfile.mockResolvedValue(account);
  updateAccountEmail.mockResolvedValue({ ...account, email: "new@example.com" });
  updateAccountPassword.mockResolvedValue(undefined);
});

describe("admin account routes", () => {
  it("returns the account without the password hash", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ account: expect.not.objectContaining({ passwordHash: expect.anything() }) });
    expect(getAccount).toHaveBeenCalledWith(session.userId);
  });

  it("updates profile and email using the session user", async () => {
    await PATCH(request({ name: "Ana Nova" }));
    await PUT(request({ email: "new@example.com" }));

    expect(updateAccountProfile).toHaveBeenCalledWith(session.userId, { name: "Ana Nova" });
    expect(updateAccountEmail).toHaveBeenCalledWith(session.userId, "new@example.com");
  });

  it("changes password using the session user", async () => {
    await POST(request({ currentPassword: "old-password", newPassword: "new-password" }));

    expect(updateAccountPassword).toHaveBeenCalledWith(session.userId, "old-password", "new-password");
  });

  it("returns unauthorized when there is no session", async () => {
    requireAdminSession.mockRejectedValue(Object.assign(new Error("unauthorized"), { name: "AdminSessionError" }));

    expect((await GET()).status).toBe(401);
  });
});
