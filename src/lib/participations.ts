import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customers, participations, promotionCustomerUsage, promotions } from "@/db/schema";

export const participationActionSchema = z.object({ action: z.enum(["confirm", "reject"]) });

export class ParticipationActionError extends Error {
  constructor(message: string) {
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
