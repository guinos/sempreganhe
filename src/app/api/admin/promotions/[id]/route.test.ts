import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession, updatePromotion, deletePromotion, PromotionNotFoundError, PromotionConflictError } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  updatePromotion: vi.fn(),
  deletePromotion: vi.fn(),
  PromotionNotFoundError: class extends Error {},
  PromotionConflictError: class extends Error {},
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdminSession }));
vi.mock("@/lib/promotions", () => ({
  updatePromotion,
  deletePromotion,
  promotionUpdateSchema: { parse: vi.fn((value: unknown) => value) },
  PromotionNotFoundError,
  PromotionConflictError,
}));

import { DELETE, PATCH } from "./route";

const session = { userId: "user-1", restaurantId: "restaurant-1" };
const context = { params: Promise.resolve({ id: "promotion-1" }) };

function request(method: string, body?: unknown) {
  return new Request("http://localhost/api/admin/promotions/promotion-1", {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue(session);
  updatePromotion.mockResolvedValue({ id: "promotion-1", status: "paused" });
  deletePromotion.mockResolvedValue({ id: "promotion-1" });
});

describe("admin promotion item routes", () => {
  it("updates a promotion using the session restaurant", async () => {
    const response = await PATCH(request("PATCH", { status: "paused" }), context);

    expect(response.status).toBe(200);
    expect(updatePromotion).toHaveBeenCalledWith(session.restaurantId, "promotion-1", { status: "paused" });
  });

  it("deletes a promotion using the session restaurant", async () => {
    const response = await DELETE(request("DELETE"), context);

    expect(response.status).toBe(200);
    expect(deletePromotion).toHaveBeenCalledWith(session.restaurantId, "promotion-1");
  });

  it("returns 404 for a promotion outside the restaurant", async () => {
    updatePromotion.mockRejectedValue(new PromotionNotFoundError("not found"));

    const response = await PATCH(request("PATCH", { status: "paused" }), context);

    expect(response.status).toBe(404);
  });

  it("returns 409 when updating to a duplicate public code", async () => {
    updatePromotion.mockRejectedValue(new PromotionConflictError());

    const response = await PATCH(request("PATCH", { publicCode: "EXISTENTE" }), context);

    expect(response.status).toBe(409);
  });
});
