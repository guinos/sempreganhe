import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { customers, participations, partners, promotionCustomerUsage, promotions, type Participation, type Promotion } from "@/db/schema";
import { isPromotionAvailable } from "@/domain/promotion";
import { normalizePhone } from "@/lib/phone";

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

export class ParticipationLimitReachedError extends Error {
  constructor() {
    super("Customer has reached the participation limit for this promotion");
    this.name = "ParticipationLimitReachedError";
  }
}

export class ParticipationRejectedError extends Error {
  constructor() {
    super("Participation was rejected");
    this.name = "ParticipationRejectedError";
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

export async function findPublicPartnerWhatsapp(partnerId: string): Promise<{ countryCode: string; phone: string } | null> {
  const [partner] = await getDb().select({ countryCode: partners.whatsappCountryCode, phone: partners.whatsappPhone }).from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner?.phone) return null;
  return { countryCode: partner.countryCode, phone: partner.phone };
}

export async function scratchPromotion(promotion: Promotion, scrapedAt = new Date()): Promise<Participation> {
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(promotions)
      .where(and(eq(promotions.id, promotion.id), eq(promotions.partnerId, promotion.partnerId)))
      .for("update")
      .limit(1);
    if (!current || !isPromotionAvailable(current, scrapedAt)) throw new PublicPromotionNotFoundError();

    const canAwardMainPrize = current.mainPrizeRedemptions < current.mainPrizeMaxRedemptions;
    const awardsMainPrize = canAwardMainPrize && Math.random() * 100 < current.mainPrizeProbability;
    const selectedRewardType = awardsMainPrize ? "main_prize" : "points";
    if (!awardsMainPrize && current.pointsPerParticipation <= 0) {
      throw new PublicPromotionNotFoundError();
    }
    const pointsAwarded = awardsMainPrize ? 0 : current.pointsPerParticipation;
    const prizeDescription = awardsMainPrize ? current.prizeDescription : `${pointsAwarded} pontos`;
    const [participation] = await tx.insert(participations).values({
      partnerId: current.partnerId,
      promotionId: current.id,
      publicToken: randomUUID(),
      prizeDescription,
      rewardType: selectedRewardType,
      pointsAwarded,
      scrapedAt,
      status: "pending_registration",
    }).returning();
    if (awardsMainPrize) {
      await tx.update(promotions).set({
        mainPrizeRedemptions: sql`${promotions.mainPrizeRedemptions} + 1`,
        status: current.mainPrizeRedemptions + 1 >= current.mainPrizeMaxRedemptions ? "ended" : current.status,
        updatedAt: scrapedAt,
      }).where(and(eq(promotions.id, current.id), eq(promotions.partnerId, current.partnerId)));
    }
    return participation;
  });
}

export async function redeemParticipation(
  publicToken: string,
  input: z.infer<typeof customerRegistrationSchema>,
  completedAt = new Date(),
): Promise<{ participation: Participation; customer: typeof customers.$inferSelect }> {
  return getDb().transaction(async (tx) => {
    const [participation] = await tx.select().from(participations).where(eq(participations.publicToken, publicToken)).limit(1);
    if (!participation) throw new ParticipationNotFoundError();
    if (participation.status === "rejected") throw new ParticipationRejectedError();
    if ((participation.status === "pending_confirmation" || participation.status === "redeemed") && participation.customerId) {
      const [customer] = await tx.select().from(customers).where(eq(customers.id, participation.customerId)).limit(1);
      if (customer) return { participation, customer };
    }

    const [partner] = await tx.select({ countryCode: partners.whatsappCountryCode })
      .from(partners)
      .where(eq(partners.id, participation.partnerId))
      .limit(1);
    const normalizedPhone = normalizePhone(input.phone, partner?.countryCode);
    const storedPhoneDigits = sql`regexp_replace(${customers.phone}, '\\D', '', 'g')`;
    const storedPhoneCanonical = sql`CASE WHEN length(${storedPhoneDigits}) <= 11 THEN ${partner?.countryCode ?? "55"} || ${storedPhoneDigits} ELSE ${storedPhoneDigits} END`;
    const [existingCustomer] = await tx.select().from(customers).where(and(
      eq(customers.partnerId, participation.partnerId),
      sql`${storedPhoneCanonical} = ${normalizedPhone}`,
    )).limit(1);
    let customer = existingCustomer;
    if (!customer) {
      const [createdCustomer] = await tx.insert(customers).values({
        partnerId: participation.partnerId,
        name: input.name,
        phone: normalizedPhone,
      }).onConflictDoNothing({ target: [customers.partnerId, customers.phone] }).returning();
      customer = createdCustomer;
      if (!customer) {
        [customer] = await tx.select().from(customers).where(and(
          eq(customers.partnerId, participation.partnerId),
          sql`${storedPhoneCanonical} = ${normalizedPhone}`,
        )).limit(1);
      }
    }
    if (!customer) throw new Error("Customer could not be created");

    const [promotion] = await tx.select({ maxParticipationsPerCustomer: promotions.maxParticipationsPerCustomer })
      .from(promotions)
      .where(and(eq(promotions.id, participation.promotionId), eq(promotions.partnerId, participation.partnerId)))
      .limit(1);
    if (!promotion) throw new PublicPromotionNotFoundError();

    const [updated] = await tx.update(participations).set({
      customerId: customer.id,
      privacyAcceptedAt: completedAt,
      registeredAt: completedAt,
      status: "pending_confirmation",
      updatedAt: completedAt,
    }).where(and(eq(participations.id, participation.id), eq(participations.status, "pending_registration"), isNull(participations.customerId))).returning();
    if (!updated) return { participation, customer };

    const [usage] = await tx.insert(promotionCustomerUsage).values({
      partnerId: participation.partnerId,
      promotionId: participation.promotionId,
      customerId: customer.id,
      participationCount: 1,
      createdAt: completedAt,
      updatedAt: completedAt,
    }).onConflictDoUpdate({
      target: [promotionCustomerUsage.partnerId, promotionCustomerUsage.promotionId, promotionCustomerUsage.customerId],
      set: {
        participationCount: sql`${promotionCustomerUsage.participationCount} + 1`,
        updatedAt: completedAt,
      },
      where: sql`${promotionCustomerUsage.participationCount} < ${promotion.maxParticipationsPerCustomer}`,
    }).returning();
    if (!usage) throw new ParticipationLimitReachedError();
    return { participation: updated, customer };
  });
}
