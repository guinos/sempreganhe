import "server-only";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customerAccounts, customers, participations, partners, promotions } from "@/db/schema";

export async function getCustomerDashboard(accountId: string) {
  const db = getDb();
  const customerPhoneDigits = sql`regexp_replace(${customers.phone}, '\\D', '', 'g')`;
  const customerPhoneCanonical = sql`CASE WHEN length(${customerPhoneDigits}) <= 11 THEN '55' || ${customerPhoneDigits} ELSE ${customerPhoneDigits} END`;
  const customerAccountMatch = and(
    eq(customerAccounts.id, accountId),
    or(eq(customers.accountId, customerAccounts.id), sql`${customerPhoneCanonical} = ${customerAccounts.phone}`),
  );
  const [account, history, redeemedByPartner] = await Promise.all([
    db.select({ firstName: customerAccounts.firstName, lastName: customerAccounts.lastName })
      .from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1),
    db.select({ id: participations.id, promotionTitle: promotions.title, prizeDescription: participations.prizeDescription, status: participations.status, scrapedAt: participations.scrapedAt, registeredAt: participations.registeredAt, partnerName: partners.name })
      .from(customers)
      .innerJoin(customerAccounts, customerAccountMatch)
      .innerJoin(participations, eq(participations.customerId, customers.id))
      .innerJoin(promotions, eq(promotions.id, participations.promotionId))
      .innerJoin(partners, eq(partners.id, participations.partnerId))
      .where(eq(customerAccounts.id, accountId))
      .orderBy(desc(participations.createdAt)),
    db.select({ partnerName: partners.name, partnerId: partners.id, redemptionCount: sql<number>`count(*)::int` })
      .from(customers)
      .innerJoin(customerAccounts, customerAccountMatch)
      .innerJoin(participations, eq(participations.customerId, customers.id))
      .innerJoin(partners, eq(partners.id, participations.partnerId))
      .where(and(eq(customerAccounts.id, accountId), eq(participations.status, "redeemed")))
      .groupBy(partners.id, partners.name)
      .orderBy(desc(sql`count(*)`)),
  ]);
  return { account: account[0] ?? null, history, redeemedByPartner };
}
