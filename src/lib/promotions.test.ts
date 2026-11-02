/* eslint-disable drizzle/enforce-delete-with-where */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({ db: {} as Record<string, unknown> }));

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => db }));

import {
  PromotionConflictError,
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from "./promotions";

const partnerId = "partner-1";
const promotion = {
  id: "promotion-1",
  partnerId,
  title: "Suco em dobro",
  prizeDescription: "Ganhe suco em dobro na compra de um",
  publicCode: "SEGUNDA-SUCO",
  status: "active" as const,
  startsAt: new Date("2026-10-19T00:00:00.000Z"),
  endsAt: new Date("2026-10-19T23:59:59.000Z"),
  maxParticipationsPerCustomer: 1,
  createdAt: new Date("2026-10-18T00:00:00.000Z"),
  updatedAt: new Date("2026-10-18T00:00:00.000Z"),
};

function chain<T>(result: T) {
  return {
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(result),
    limit: vi.fn().mockResolvedValue(result),
    returning: vi.fn().mockResolvedValue(result),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("promotion service", () => {
  it("lists only promotions belonging to the partner", async () => {
    const query = chain([promotion]);
    db.select = vi.fn().mockReturnValue(query);

    await expect(listPromotions(partnerId)).resolves.toEqual([promotion]);
    expect(query.where).toHaveBeenCalledOnce();
  });

  it("creates a promotion with the session partner", async () => {
    const query = chain([promotion]);
    db.insert = vi.fn().mockReturnValue(query);

    await expect(
      createPromotion(partnerId, {
        title: promotion.title,
        prizeDescription: promotion.prizeDescription,
        publicCode: promotion.publicCode,
        status: promotion.status,
        startsAt: promotion.startsAt,
        endsAt: promotion.endsAt,
        maxParticipationsPerCustomer: 1,
      }),
    ).resolves.toEqual(promotion);
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it("maps a duplicate public code to a conflict error", async () => {
    const query = chain([]);
    query.returning = vi.fn().mockRejectedValue({ code: "23505", constraint: "promotions_public_code_unique" });
    db.insert = vi.fn().mockReturnValue(query);

    await expect(
      createPromotion(partnerId, {
        title: promotion.title,
        prizeDescription: promotion.prizeDescription,
        publicCode: promotion.publicCode,
        status: promotion.status,
        startsAt: promotion.startsAt,
        endsAt: promotion.endsAt,
        maxParticipationsPerCustomer: 1,
      }),
    ).rejects.toBeInstanceOf(PromotionConflictError);
  });

  it("updates a promotion by partner and id", async () => {
    const query = chain([promotion]);
    db.update = vi.fn().mockReturnValue(query);

    await expect(updatePromotion(partnerId, promotion.id, { status: "paused" })).resolves.toEqual(promotion);
    expect(db.update).toHaveBeenCalledOnce();
  });

  it("deletes a promotion by partner and id", async () => {
    const query = chain([promotion]);
    db.delete = vi.fn().mockReturnValue(query);

    await expect(deletePromotion(partnerId, promotion.id)).resolves.toEqual(promotion);
    expect(db.delete).toHaveBeenCalledOnce();
  });
});
