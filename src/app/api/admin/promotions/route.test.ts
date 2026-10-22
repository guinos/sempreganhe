import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession, listPromotions, createPromotion, PromotionConflictError } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  listPromotions: vi.fn(),
  createPromotion: vi.fn(),
  PromotionConflictError: class extends Error {},
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdminSession }));
vi.mock("@/lib/promotions", () => ({ listPromotions, createPromotion, PromotionConflictError, promotionCreateSchema: { parse: vi.fn((value: Record<string, unknown>) => ({
  title: value.title,
  prizeDescription: value.prizeDescription,
  publicCode: value.publicCode,
  status: value.status,
  startsAt: new Date(String(value.startsAt)),
  endsAt: new Date(String(value.endsAt)),
})) } }));

import { GET, POST } from "./route";

const session = { userId: "user-1", partnerId: "partner-1" };

function request(body?: unknown) {
  return new Request("http://localhost/api/admin/promotions", {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue(session);
  listPromotions.mockResolvedValue([]);
  createPromotion.mockResolvedValue({ id: "promotion-1" });
});

describe("admin promotions collection routes", () => {
  it("lists promotions using the session partner", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ promotions: [] });
    expect(listPromotions).toHaveBeenCalledWith(session.partnerId);
  });

  it("creates a promotion without accepting partnerId from the payload", async () => {
    const payload = {
      partnerId: "attacker-partner",
      title: "Prêmio",
      prizeDescription: "Sobremesa grátis",
      publicCode: "CODIGO",
      status: "draft",
      startsAt: "2026-10-19T00:00:00.000Z",
      endsAt: "2026-10-20T00:00:00.000Z",
    };

    const response = await POST(request(payload));

    expect(response.status).toBe(201);
    expect(createPromotion).toHaveBeenCalledWith(session.partnerId, expect.objectContaining({
      title: payload.title,
      publicCode: payload.publicCode,
      startsAt: new Date(payload.startsAt),
      endsAt: new Date(payload.endsAt),
    }));
    expect(createPromotion.mock.calls[0][1]).not.toHaveProperty("partnerId");
  });

  it("returns 401 when the admin session is missing", async () => {
    requireAdminSession.mockRejectedValue(Object.assign(new Error("unauthorized"), { name: "AdminSessionError" }));

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 409 when the public code already exists", async () => {
    createPromotion.mockRejectedValue(new PromotionConflictError());

    const response = await POST(request({ title: "Prêmio", prizeDescription: "Sobremesa", publicCode: "CODIGO", status: "draft", startsAt: "2026-10-19T00:00:00.000Z", endsAt: "2026-10-20T00:00:00.000Z" }));

    expect(response.status).toBe(409);
  });
});
