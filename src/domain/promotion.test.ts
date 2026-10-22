import { describe, expect, it } from "vitest";
import type { Promotion } from "@/db/schema";
import { isPromotionAvailable } from "./promotion";

const startsAt = new Date("2026-10-19T10:00:00.000Z");
const endsAt = new Date("2026-10-19T18:00:00.000Z");

function promotion(status: Promotion["status"]): Promotion {
  return {
    id: "promotion-id",
    partnerId: "partner-id",
    title: "Café grátis",
    prizeDescription: "Um café",
    publicCode: "CAFE",
    status,
    startsAt,
    endsAt,
    createdAt: startsAt,
    updatedAt: startsAt,
  };
}

describe("isPromotionAvailable", () => {
  it("returns true for an active promotion inside its period", () => {
    expect(isPromotionAvailable(promotion("active"), new Date("2026-10-19T12:00:00.000Z"))).toBe(true);
  });

  it("includes the start and end boundaries", () => {
    const active = promotion("active");

    expect(isPromotionAvailable(active, startsAt)).toBe(true);
    expect(isPromotionAvailable(active, endsAt)).toBe(true);
  });

  it.each(["draft", "paused", "ended"] as const)("returns false for %s promotions", (status) => {
    expect(isPromotionAvailable(promotion(status), new Date("2026-10-19T12:00:00.000Z"))).toBe(false);
  });

  it("returns false before the start and after the end", () => {
    const active = promotion("active");

    expect(isPromotionAvailable(active, new Date("2026-10-19T09:59:59.999Z"))).toBe(false);
    expect(isPromotionAvailable(active, new Date("2026-10-19T18:00:00.001Z"))).toBe(false);
  });

  it("returns false for an unknown runtime status", () => {
    const invalid = { ...promotion("active"), status: "unknown" } as unknown as Promotion;

    expect(isPromotionAvailable(invalid, new Date("2026-10-19T12:00:00.000Z"))).toBe(false);
  });
});
