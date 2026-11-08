import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customerPointBalances, customerPointsLedger, customers, pointRedemptions, pointRewards } from "@/db/schema";

export const pointRedemptionActionSchema = z.object({ action: z.enum(["confirm", "reject"]) });

export function listPointRedemptions(partnerId: string) {
  return getDb().select({
    id: pointRedemptions.id,
    customerName: customers.name,
    customerPhone: customers.phone,
    rewardTitle: pointRewards.title,
    pointsCost: pointRedemptions.pointsCost,
    status: pointRedemptions.status,
    requestedAt: pointRedemptions.requestedAt,
    decidedAt: pointRedemptions.decidedAt,
  }).from(pointRedemptions)
    .innerJoin(customers, and(eq(pointRedemptions.customerId, customers.id), eq(pointRedemptions.partnerId, customers.partnerId)))
    .innerJoin(pointRewards, eq(pointRedemptions.pointRewardId, pointRewards.id))
    .where(eq(pointRedemptions.partnerId, partnerId)).orderBy(desc(pointRedemptions.requestedAt));
}

export async function updatePointRedemption(partnerId: string, id: string, action: "confirm" | "reject", userId: string) {
  return getDb().transaction(async (tx) => {
    const [redemption] = await tx.update(pointRedemptions).set({
      status: action === "confirm" ? "confirmed" : "rejected",
      decidedAt: new Date(),
      decidedByUserId: userId,
      updatedAt: new Date(),
    }).where(and(eq(pointRedemptions.id, id), eq(pointRedemptions.partnerId, partnerId), eq(pointRedemptions.status, "pending"))).returning();
    if (!redemption) throw new Error("Point redemption is not awaiting confirmation");
    if (action === "reject") {
      const [balance] = await tx.update(customerPointBalances).set({
        availablePoints: sql`${customerPointBalances.availablePoints} + ${redemption.pointsCost}`,
        updatedAt: new Date(),
      }).where(and(eq(customerPointBalances.partnerId, partnerId), eq(customerPointBalances.customerId, redemption.customerId), sql`${customerPointBalances.availablePoints} + ${redemption.pointsCost} <= 100`)).returning();
      if (!balance) throw new Error("Could not restore customer points");
      await tx.insert(customerPointsLedger).values({
        partnerId,
        customerId: redemption.customerId,
        redemptionId: redemption.id,
        entryType: "released",
        pointsDelta: redemption.pointsCost,
        balanceAfter: balance.availablePoints,
        description: "Pontos devolvidos após recusa do resgate",
      });
    }
    return redemption;
  });
}
