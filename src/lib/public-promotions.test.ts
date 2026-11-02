import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, available } = vi.hoisted(() => ({ db: {} as Record<string, unknown>, available: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => db }));
vi.mock("@/domain/promotion", () => ({ isPromotionAvailable: available }));

import { findPublicPromotion, scratchPromotion, redeemParticipation, PublicPromotionNotFoundError } from "./public-promotions";

const promotion = {
  id: "promotion-1", partnerId: "partner-1", title: "Quarta do chopp", prizeDescription: "Ganhe um chopp",
  publicCode: "QUARTA", status: "active" as const, startsAt: new Date("2026-10-19T00:00:00Z"), endsAt: new Date("2026-10-20T00:00:00Z"),
  maxParticipationsPerCustomer: 1,
  createdAt: new Date(), updatedAt: new Date(),
};

function query<T>(result: T) {
  return { from: vi.fn().mockReturnThis(), values: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), onConflictDoNothing: vi.fn().mockReturnThis(), onConflictDoUpdate: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue(result), returning: vi.fn().mockResolvedValue(result) };
}

beforeEach(() => vi.clearAllMocks());

describe("public promotion flow", () => {
  it("only exposes an active promotion", async () => {
    db.select = vi.fn().mockReturnValue(query([promotion]));
    available.mockReturnValue(false);

    await expect(findPublicPromotion("QUARTA")).rejects.toBeInstanceOf(PublicPromotionNotFoundError);
  });

  it("copies the configured prize when the customer scratches", async () => {
    const created = { ...promotion, id: "participation-1", publicToken: "token-1", status: "pending_registration" as const };
    const insert = query([created]);
    db.insert = vi.fn().mockReturnValue(insert);

    await expect(scratchPromotion(promotion)).resolves.toEqual(created);
    expect(insert.values).toHaveBeenCalledWith(expect.objectContaining({
      partnerId: promotion.partnerId,
      promotionId: promotion.id,
      prizeDescription: promotion.prizeDescription,
      status: "pending_registration",
    }));
  });

  it("reuses the customer within the same partner when redeeming", async () => {
    const customer = { id: "customer-1", partnerId: "partner-1", name: "Ana", phone: "11999999999", createdAt: new Date(), updatedAt: new Date() };
    const participation = { id: "participation-1", partnerId: "partner-1", promotionId: "promotion-1", customerId: null, publicToken: "token-1", prizeDescription: "Ganhe um chopp", privacyAcceptedAt: null, scrapedAt: new Date(), registeredAt: null, status: "pending_registration" as const, createdAt: new Date(), updatedAt: new Date() };
    const updated = { ...participation, customerId: customer.id, status: "pending_confirmation" as const, registeredAt: new Date(), privacyAcceptedAt: new Date() };
    const tx = {
      select: vi.fn().mockReturnValueOnce(query([participation])).mockReturnValueOnce(query([{ countryCode: "55" }])).mockReturnValueOnce(query([customer])).mockReturnValueOnce(query([{ maxParticipationsPerCustomer: 1 }])),
      insert: vi.fn().mockReturnValue(query([{ participationCount: 1 }])),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), ...query([updated]) }),
    };
    db.transaction = vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx));

    await expect(redeemParticipation("token-1", { name: "Ana", phone: "11999999999" })).resolves.toEqual({ participation: updated, customer });
    expect(tx.update).toHaveBeenCalledOnce();
    expect(tx.insert).toHaveBeenCalledOnce();
  });
});
