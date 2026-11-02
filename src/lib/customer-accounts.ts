import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customerAccounts, customers } from "@/db/schema";
import { hashPassword } from "@/lib/customer-auth";
import { normalizePhone } from "@/lib/phone";

export const CUSTOMER_PRIVACY_POLICY_VERSION = "2026-11-02";

export const customerAccountRegistrationSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(8).max(32),
  birthDate: z.coerce.date().refine((date) => date < new Date(), "Data de nascimento inválida"),
  password: z.string().min(8).max(200),
  privacyAccepted: z.literal(true),
});

export const customerAccountUpdateSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(8).max(32),
  birthDate: z.coerce.date().refine((date) => date < new Date(), "Data de nascimento inválida"),
});

export class CustomerAccountConflictError extends Error {
  constructor() {
    super("Customer account already exists");
    this.name = "CustomerAccountConflictError";
  }
}

export class CustomerAccountNotFoundError extends Error {
  constructor() {
    super("Customer account not found");
    this.name = "CustomerAccountNotFoundError";
  }
}

export async function registerCustomerAccount(input: z.infer<typeof customerAccountRegistrationSchema>) {
  const phone = normalizePhone(input.phone);
  try {
    return await getDb().transaction(async (tx) => {
      const [account] = await tx.insert(customerAccounts).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone,
        birthDate: input.birthDate,
        passwordHash: await hashPassword(input.password),
        privacyAcceptedAt: new Date(),
        privacyPolicyVersion: CUSTOMER_PRIVACY_POLICY_VERSION,
      }).returning();
      await tx.update(customers).set({ accountId: account.id, updatedAt: new Date() }).where(eq(customers.phone, phone));
      return account;
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") throw new CustomerAccountConflictError();
    throw error;
  }
}

export async function getCustomerAccount(accountId: string) {
  const [account] = await getDb()
    .select({
      firstName: customerAccounts.firstName,
      lastName: customerAccounts.lastName,
      email: customerAccounts.email,
      phone: customerAccounts.phone,
      birthDate: customerAccounts.birthDate,
      privacyAcceptedAt: customerAccounts.privacyAcceptedAt,
      privacyPolicyVersion: customerAccounts.privacyPolicyVersion,
    })
    .from(customerAccounts)
    .where(and(eq(customerAccounts.id, accountId), eq(customerAccounts.active, true)))
    .limit(1);
  if (!account) throw new CustomerAccountNotFoundError();
  return account;
}

export async function updateCustomerAccount(accountId: string, input: z.infer<typeof customerAccountUpdateSchema>) {
  const phone = normalizePhone(input.phone);
  try {
    const [account] = await getDb()
      .update(customerAccounts)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone,
        birthDate: input.birthDate,
        updatedAt: new Date(),
      })
      .where(and(eq(customerAccounts.id, accountId), eq(customerAccounts.active, true)))
      .returning({ id: customerAccounts.id });
    if (!account) throw new CustomerAccountNotFoundError();
    return getCustomerAccount(account.id);
  } catch (error) {
    if (error instanceof CustomerAccountNotFoundError) throw error;
    if (error && typeof error === "object" && "code" in error && error.code === "23505") throw new CustomerAccountConflictError();
    throw error;
  }
}
