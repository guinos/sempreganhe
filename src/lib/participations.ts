import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customers, participations, promotions } from "@/db/schema";

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
  const [updated] = await getDb().update(participations).set({
    status,
    updatedAt: new Date(),
  }).where(and(
    eq(participations.id, participationId),
    eq(participations.partnerId, partnerId),
    eq(participations.status, "pending_confirmation"),
  )).returning();
  if (updated) return updated;

  const [current] = await getDb().select({ status: participations.status })
    .from(participations)
    .where(and(eq(participations.id, participationId), eq(participations.partnerId, partnerId)))
    .limit(1);
  if (!current) throw new ParticipationActionError("Participation not found");
  throw new ParticipationActionError("Participation is not awaiting confirmation");
}
