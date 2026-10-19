import { describe, expect, it } from "vitest";
import type { Participation } from "@/db/schema";
import { completeParticipation } from "./participation";

const createdAt = new Date("2026-10-19T09:00:00.000Z");
const completedAt = new Date("2026-10-19T12:00:00.000Z");

function participation(status: Participation["status"] = "pending_registration"): Participation {
  return {
    id: "participation-id",
    restaurantId: "restaurant-id",
    promotionId: "promotion-id",
    customerId: status === "redeemed" ? "old-customer-id" : null,
    publicToken: "public-token",
    prizeDescription: "Um café",
    privacyAcceptedAt: status === "redeemed" ? new Date("2026-10-19T11:00:00.000Z") : null,
    scrapedAt: new Date("2026-10-19T09:30:00.000Z"),
    registeredAt: status === "redeemed" ? new Date("2026-10-19T11:00:00.000Z") : null,
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("completeParticipation", () => {
  it("completes a pending participation with the customer and completion time", () => {
    const result = completeParticipation(participation(), {
      customerId: "customer-id",
      completedAt,
    });

    expect(result).toMatchObject({
      customerId: "customer-id",
      privacyAcceptedAt: completedAt,
      registeredAt: completedAt,
      status: "redeemed",
    });
  });

  it("does not mutate the pending participation", () => {
    const original = participation();
    const result = completeParticipation(original, { customerId: "customer-id", completedAt });

    expect(result).not.toBe(original);
    expect(original).toEqual(participation());
  });

  it("preserves the participation fields when completing it", () => {
    const original = participation();
    const result = completeParticipation(original, { customerId: "customer-id", completedAt });

    expect(result).toMatchObject({
      id: original.id,
      restaurantId: original.restaurantId,
      promotionId: original.promotionId,
      publicToken: original.publicToken,
      prizeDescription: original.prizeDescription,
      scrapedAt: original.scrapedAt,
      createdAt: original.createdAt,
      updatedAt: original.updatedAt,
    });
  });

  it("is idempotent for an already redeemed participation", () => {
    const original = participation("redeemed");
    const result = completeParticipation(original, { customerId: "new-customer-id", completedAt });

    expect(result).toEqual(original);
    expect(result).not.toBe(original);
  });

  it("returns a redeemed copy on an idempotent retry with an empty customer id", () => {
    const original = participation("redeemed");
    const result = completeParticipation(original, { customerId: "", completedAt });

    expect(result).toEqual(original);
    expect(result).not.toBe(original);
  });

  it("rejects an empty customer id", () => {
    expect(() => completeParticipation(participation(), { customerId: "", completedAt })).toThrow(
      "customerId must not be empty",
    );
  });

  it("rejects an unknown runtime status", () => {
    const invalid = { ...participation(), status: "unknown" } as unknown as Participation;

    expect(() => completeParticipation(invalid, { customerId: "customer-id", completedAt })).toThrow(
      "Unknown participation status: unknown",
    );
  });
});
