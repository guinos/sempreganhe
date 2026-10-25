import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession, getTeamUser, listTeam, createTeamMember, TeamMemberConflictError } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getTeamUser: vi.fn(),
  listTeam: vi.fn(),
  createTeamMember: vi.fn(),
  TeamMemberConflictError: class extends Error {},
}));

vi.mock("@/lib/auth", () => ({ requireAdminSession }));
vi.mock("@/lib/team", () => ({
  getTeamUser,
  listTeam,
  createTeamMember,
  TeamMemberConflictError,
  TeamPermissionError: class extends Error {},
  teamMemberCreateSchema: { parse: vi.fn((value: unknown) => value) },
}));

import { GET, POST } from "./route";

const ownerSession = { userId: "owner-1", partnerId: "partner-1" };
const request = (body?: unknown) => new Request("http://localhost/api/admin/team", { method: body ? "POST" : "GET", headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue(ownerSession);
  getTeamUser.mockResolvedValue({ role: "owner" });
  listTeam.mockResolvedValue([]);
  createTeamMember.mockResolvedValue({ id: "admin-1", role: "admin" });
});

describe("admin team routes", () => {
  it("lists only the authenticated partner team", async () => {
    await GET();
    expect(listTeam).toHaveBeenCalledWith(ownerSession.partnerId);
  });

  it("allows only the owner to add an admin", async () => {
    const response = await POST(request({ name: "Admin", email: "admin@example.com", password: "password123", role: "admin" }));

    expect(response.status).toBe(201);
    expect(getTeamUser).toHaveBeenCalledWith(ownerSession.partnerId, ownerSession.userId);
    expect(createTeamMember).toHaveBeenCalledWith(ownerSession.partnerId, expect.objectContaining({ role: "admin" }));
  });

  it("rejects team creation by an admin", async () => {
    getTeamUser.mockResolvedValue({ role: "admin" });

    const response = await POST(request({ name: "Admin", email: "admin@example.com", password: "password123" }));

    expect(response.status).toBe(403);
  });

  it("returns conflict for a duplicate e-mail", async () => {
    createTeamMember.mockRejectedValue(new TeamMemberConflictError());

    const response = await POST(request({ name: "Admin", email: "admin@example.com", password: "password123" }));

    expect(response.status).toBe(409);
  });
});
