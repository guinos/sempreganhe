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

export class CustomerAccountConflictError extends Error {
  constructor() {
    super("Customer account already exists");
    this.name = "CustomerAccountConflictError";
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
