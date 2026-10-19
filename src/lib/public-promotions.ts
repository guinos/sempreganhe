import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { customers, participations, promotions, type Participation, type Promotion } from "@/db/schema";
import { isPromotionAvailable } from "@/domain/promotion";

export const customerRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
});

export class PublicPromotionNotFoundError extends Error {
  constructor() {
    super("Promotion not found");
    this.name = "PublicPromotionNotFoundError";
  }
}

export class ParticipationNotFoundError extends Error {
  constructor() {
    super("Participation not found");
    this.name = "ParticipationNotFoundError";
  }
}

export async function findPublicParticipation(publicToken: string): Promise<Pick<Participation, "status" | "prizeDescription">> {
  const [participation] = await getDb().select({
    status: participations.status,
    prizeDescription: participations.prizeDescription,
  }).from(participations).where(eq(participations.publicToken, publicToken)).limit(1);
  if (!participation) throw new ParticipationNotFoundError();
  return participation;
}

export async function findPublicPromotion(publicCode: string, now = new Date()): Promise<Promotion> {
  const [promotion] = await getDb().select().from(promotions).where(eq(promotions.publicCode, publicCode)).limit(1);
  if (!promotion || !isPromotionAvailable(promotion, now)) throw new PublicPromotionNotFoundError();
  return promotion;
}

export async function scratchPromotion(promotion: Promotion, scrapedAt = new Date()): Promise<Participation> {
  const [participation] = await getDb().insert(participations).values({
    restaurantId: promotion.restaurantId,
    promotionId: promotion.id,
    publicToken: randomUUID(),
    prizeDescription: promotion.prizeDescription,
    scrapedAt,
    status: "pending_registration",
  }).returning();
  return participation;
}

export async function redeemParticipation(
  publicToken: string,
  input: z.infer<typeof customerRegistrationSchema>,
  completedAt = new Date(),
): Promise<{ participation: Participation; customer: typeof customers.$inferSelect }> {
  return getDb().transaction(async (tx) => {
    const [participation] = await tx.select().from(participations).where(eq(participations.publicToken, publicToken)).limit(1);
    if (!participation) throw new ParticipationNotFoundError();
    if ((participation.status === "pending_confirmation" || participation.status === "redeemed" || participation.status === "rejected") && participation.customerId) {
      const [customer] = await tx.select().from(customers).where(eq(customers.id, participation.customerId)).limit(1);
      if (customer) return { participation, customer };
    }

    const [existingCustomer] = await tx.select().from(customers).where(and(
      eq(customers.restaurantId, participation.restaurantId),
      eq(customers.phone, input.phone),
    )).limit(1);
    const customer = existingCustomer ?? (await tx.insert(customers).values({
      restaurantId: participation.restaurantId,
      name: input.name,
      phone: input.phone,
    }).returning())[0];

    const [updated] = await tx.update(participations).set({
      customerId: customer.id,
      privacyAcceptedAt: completedAt,
      registeredAt: completedAt,
      status: "pending_confirmation",
      updatedAt: completedAt,
    }).where(and(eq(participations.id, participation.id), eq(participations.status, "pending_registration"))).returning();
    if (!updated) return { participation, customer };
    return { participation: updated, customer };
  });
}
