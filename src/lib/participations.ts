import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customerPointBalances, customerPointsLedger, customers, participations, promotionCustomerUsage, promotions } from "@/db/schema";

export const participationActionSchema = z.object({ action: z.enum(["confirm", "reject"]) });

export class ParticipationActionError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = "ParticipationActionError";
  }
}

export function listParticipations(partnerId: string) {
  return getDb()
    .select({
      id: participations.id,
      publicToken: participations.publicToken,
      prizeDescription: participations.prizeDescription,
      rewardType: participations.rewardType,
      pointsAwarded: participations.pointsAwarded,
      status: participations.status,
      scrapedAt: participations.scrapedAt,
      registeredAt: participations.registeredAt,
      promotionTitle: promotions.title,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(participations)
    .innerJoin(promotions, eq(participations.promotionId, promotions.id))
    .leftJoin(customers, eq(participations.customerId, customers.id))
    .where(eq(participations.partnerId, partnerId))
    .orderBy(desc(participations.createdAt));
}

export async function updateParticipationStatus(
  partnerId: string,
  participationId: string,
  action: z.infer<typeof participationActionSchema>["action"],
) {
  const status = action === "confirm" ? "redeemed" : "rejected";
  const completedAt = new Date();
  const updated = await getDb().transaction(async (tx) => {
    const [participation] = await tx.update(participations).set({
      status,
      updatedAt: completedAt,
    }).where(and(
      eq(participations.id, participationId),
      eq(participations.partnerId, partnerId),
      eq(participations.status, "pending_confirmation"),
    )).returning();
    if (!participation) return undefined;
    if (action === "confirm" && participation.rewardType === "points" && participation.customerId && participation.pointsAwarded > 0) {
      const [balance] = await tx.insert(customerPointBalances).values({
        partnerId,
        customerId: participation.customerId,
        availablePoints: participation.pointsAwarded,
        createdAt: completedAt,
        updatedAt: completedAt,
      }).onConflictDoUpdate({
        target: [customerPointBalances.partnerId, customerPointBalances.customerId],
        set: {
          availablePoints: sql`${customerPointBalances.availablePoints} + ${participation.pointsAwarded}`,
          updatedAt: completedAt,
        },
        where: sql`${customerPointBalances.availablePoints} + ${participation.pointsAwarded} <= 100`,
      }).returning();
      if (!balance) throw new ParticipationActionError("O customer atingiu 100 pontos. Ele precisa resgatar uma recompensa antes de acumular mais pontos.", "POINTS_LIMIT_REACHED");
      await tx.insert(customerPointsLedger).values({
        partnerId,
        customerId: participation.customerId,
        participationId: participation.id,
        entryType: "earned",
        pointsDelta: participation.pointsAwarded,
        balanceAfter: balance.availablePoints,
        description: "Pontos por participação confirmada",
        createdAt: completedAt,
        updatedAt: completedAt,
      });
    }
    if (action === "reject" && participation.customerId) {
      await tx.update(promotionCustomerUsage).set({
        participationCount: sql`${promotionCustomerUsage.participationCount} - 1`,
        updatedAt: completedAt,
      }).where(and(
        eq(promotionCustomerUsage.partnerId, partnerId),
        eq(promotionCustomerUsage.promotionId, participation.promotionId),
        eq(promotionCustomerUsage.customerId, participation.customerId),
        gt(promotionCustomerUsage.participationCount, 0),
      ));
    }
    return participation;
  });
  if (updated) return updated;

  const [current] = await getDb().select({ status: participations.status })
    .from(participations)
    .where(and(eq(participations.id, participationId), eq(participations.partnerId, partnerId)))
    .limit(1);
  if (!current) throw new ParticipationActionError("Participation not found");
  throw new ParticipationActionError("Participation is not awaiting confirmation");
}
