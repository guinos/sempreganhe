import "server-only";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customerAccounts, customerPointBalances, customerPointsLedger, customers, pointRedemptions, pointRewards, partners } from "@/db/schema";

export const pointRedemptionRequestSchema = z.object({ rewardId: z.string().uuid() });

export class CustomerPointError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerPointError";
  }
}

function customerMatch(accountId: string) {
  const digits = sql`regexp_replace(${customers.phone}, '\\D', '', 'g')`;
  const canonical = sql`CASE WHEN length(${digits}) <= 11 THEN '55' || ${digits} ELSE ${digits} END`;
  return or(eq(customers.accountId, accountId), sql`${canonical} = ${customerAccounts.phone}`);
}

export async function getCustomerPointsDashboard(accountId: string) {
  const db = getDb();
  const balances = await db.select({
    partnerId: customerPointBalances.partnerId,
    partnerName: partners.name,
    availablePoints: customerPointBalances.availablePoints,
    updatedAt: customerPointBalances.updatedAt,
  }).from(customerPointBalances)
    .innerJoin(customers, and(eq(customerPointBalances.customerId, customers.id), eq(customerPointBalances.partnerId, customers.partnerId)))
    .innerJoin(customerAccounts, and(eq(customerAccounts.id, accountId), customerMatch(accountId)))
    .innerJoin(partners, eq(partners.id, customerPointBalances.partnerId))
    .where(eq(customerAccounts.id, accountId));

  const rewards = await db.select({
    id: pointRewards.id,
    partnerId: pointRewards.partnerId,
    partnerName: partners.name,
    title: pointRewards.title,
    description: pointRewards.description,
    redemptionType: pointRewards.redemptionType,
    discountValue: pointRewards.discountValue,
    costPoints: pointRewards.costPoints,
  }).from(pointRewards)
    .innerJoin(customerPointBalances, eq(pointRewards.partnerId, customerPointBalances.partnerId))
    .innerJoin(customers, and(eq(customerPointBalances.customerId, customers.id), eq(customerPointBalances.partnerId, customers.partnerId)))
    .innerJoin(customerAccounts, and(eq(customerAccounts.id, accountId), customerMatch(accountId)))
    .innerJoin(partners, eq(partners.id, pointRewards.partnerId))
    .where(and(eq(pointRewards.active, true), eq(customerAccounts.id, accountId))).orderBy(desc(pointRewards.createdAt));
  const redemptions = await db.select({
    id: pointRedemptions.id,
    partnerId: pointRedemptions.partnerId,
    partnerName: partners.name,
    rewardTitle: pointRewards.title,
    pointsCost: pointRedemptions.pointsCost,
    status: pointRedemptions.status,
    requestedAt: pointRedemptions.requestedAt,
    decidedAt: pointRedemptions.decidedAt,
  }).from(pointRedemptions)
    .innerJoin(customers, and(eq(pointRedemptions.customerId, customers.id), eq(pointRedemptions.partnerId, customers.partnerId)))
    .innerJoin(customerAccounts, and(eq(customerAccounts.id, accountId), customerMatch(accountId)))
    .innerJoin(partners, eq(partners.id, pointRedemptions.partnerId))
    .innerJoin(pointRewards, eq(pointRewards.id, pointRedemptions.pointRewardId))
    .where(eq(customerAccounts.id, accountId)).orderBy(desc(pointRedemptions.requestedAt));

  return { balances, rewards, redemptions };
}

export async function requestCustomerPointRedemption(accountId: string, rewardId: string) {
  return getDb().transaction(async (tx) => {
    const [account] = await tx.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1);
    if (!account) throw new CustomerPointError("Customer account not found");
    const [reward] = await tx.select().from(pointRewards).where(and(eq(pointRewards.id, rewardId), eq(pointRewards.active, true))).limit(1);
    if (!reward) throw new CustomerPointError("Point reward not found");
    const [customer] = await tx.select({ customer: customers }).from(customers)
      .innerJoin(customerAccounts, and(eq(customerAccounts.id, accountId), customerMatch(accountId)))
      .where(eq(customers.partnerId, reward.partnerId)).limit(1);
    const linkedCustomer = customer?.customer;
    if (!linkedCustomer) throw new CustomerPointError("Customer is not registered with this partner");
    const [currentBalance] = await tx.select({
      id: customerPointBalances.id,
      availablePoints: customerPointBalances.availablePoints,
    }).from(customerPointBalances)
      .where(and(
        eq(customerPointBalances.partnerId, reward.partnerId),
        eq(customerPointBalances.customerId, linkedCustomer.id),
      )).limit(1);
    if (!currentBalance || currentBalance.availablePoints < reward.costPoints) {
      throw new CustomerPointError("Customer does not have enough points");
    }
    const [balance] = await tx.update(customerPointBalances).set({
      availablePoints: sql`${customerPointBalances.availablePoints} - ${reward.costPoints}`,
      updatedAt: new Date(),
    }).where(and(eq(customerPointBalances.id, currentBalance.id), sql`${customerPointBalances.availablePoints} >= ${reward.costPoints}`)).returning();
    if (!balance) throw new CustomerPointError("Customer does not have enough points");
    const [redemption] = await tx.insert(pointRedemptions).values({
      partnerId: reward.partnerId,
      customerId: linkedCustomer.id,
      pointRewardId: reward.id,
      pointsCost: reward.costPoints,
      status: "pending",
    }).returning();
    await tx.insert(customerPointsLedger).values({
      partnerId: reward.partnerId,
      customerId: linkedCustomer.id,
      redemptionId: redemption.id,
      entryType: "reserved",
      pointsDelta: -reward.costPoints,
      balanceAfter: balance.availablePoints,
      description: `Resgate solicitado: ${reward.title}`,
    });
    return redemption;
  });
}
