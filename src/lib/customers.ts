import "server-only";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { customers, type Customer } from "@/db/schema";

const customerFields = {
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(8).max(32),
};

export const customerCreateSchema = z.object(customerFields);
export const customerUpdateSchema = z.object(customerFields).partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export class CustomerConflictError extends Error {
  constructor() {
    super("Customer phone already exists for this partner");
    this.name = "CustomerConflictError";
  }
}

export class CustomerNotFoundError extends Error {
  constructor() {
    super("Customer not found");
    this.name = "CustomerNotFoundError";
  }
}

export class CustomerInUseError extends Error {
  constructor() {
    super("Customer has participations and cannot be deleted");
    this.name = "CustomerInUseError";
  }
}

export function listCustomers(partnerId: string, search?: string): Promise<Customer[]> {
  const normalizedSearch = search?.trim();
  const searchFilter = normalizedSearch
    ? or(ilike(customers.name, `%${normalizedSearch}%`), ilike(customers.phone, `%${normalizedSearch}%`))
    : undefined;

  return getDb()
    .select()
    .from(customers)
    .where(searchFilter ? and(eq(customers.partnerId, partnerId), searchFilter) : eq(customers.partnerId, partnerId))
    .orderBy(desc(customers.createdAt));
}

export async function createCustomer(partnerId: string, input: CustomerCreateInput): Promise<Customer> {
  try {
    const [customer] = await getDb().insert(customers).values({ ...input, partnerId }).returning();
    return customer;
  } catch (error) {
    if (isPhoneConflict(error)) throw new CustomerConflictError();
    throw error;
  }
}

export async function updateCustomer(partnerId: string, id: string, input: CustomerUpdateInput): Promise<Customer> {
  try {
    const [customer] = await getDb()
      .update(customers)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.partnerId, partnerId)))
      .returning();
    if (!customer) throw new CustomerNotFoundError();
    return customer;
  } catch (error) {
    if (error instanceof CustomerNotFoundError) throw error;
    if (isPhoneConflict(error)) throw new CustomerConflictError();
    throw error;
  }
}

export async function deleteCustomer(partnerId: string, id: string): Promise<void> {
  try {
    const [customer] = await getDb()
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.partnerId, partnerId)))
      .returning({ id: customers.id });
    if (!customer) throw new CustomerNotFoundError();
  } catch (error) {
    if (error instanceof CustomerNotFoundError) throw error;
    if (isForeignKeyConflict(error)) throw new CustomerInUseError();
    throw error;
  }
}

function isPhoneConflict(error: unknown): boolean {
  return hasConstraint(error, "customers_partner_phone_unique");
}

function isForeignKeyConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23503");
}

function hasConstraint(error: unknown, constraint: string): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "23505" &&
      "constraint" in error && error.constraint === constraint,
  );
}
