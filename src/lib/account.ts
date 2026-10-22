import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users, type User } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";

const accountProfileFields = {
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(32).nullable(),
  documentType: z.enum(["CPF", "CNPJ"]).nullable(),
  documentNumber: z.string().trim().max(32).nullable(),
  billingAddress: z.string().trim().max(500).nullable(),
};

export const accountProfileSchema = z.object(accountProfileFields);
export const accountEmailSchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) });
export const accountPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export class AccountNotFoundError extends Error {
  constructor() {
    super("Account not found");
    this.name = "AccountNotFoundError";
  }
}

export class AccountConflictError extends Error {
  constructor() {
    super("Email already exists");
    this.name = "AccountConflictError";
  }
}

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super("Current password is invalid");
    this.name = "InvalidCurrentPasswordError";
  }
}

export type AccountProfileInput = z.infer<typeof accountProfileSchema>;

export function getAccount(userId: string): Promise<User> {
  return getUser(userId);
}

export async function updateAccountProfile(userId: string, input: AccountProfileInput): Promise<User> {
  const [user] = await getDb().update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
  if (!user) throw new AccountNotFoundError();
  return user;
}

export async function updateAccountEmail(userId: string, email: string): Promise<User> {
  try {
    const [user] = await getDb().update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    if (!user) throw new AccountNotFoundError();
    return user;
  } catch (error) {
    if (error instanceof AccountNotFoundError) throw error;
    if (isEmailConflict(error)) throw new AccountConflictError();
    throw error;
  }
}

export async function updateAccountPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await getUser(userId);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new InvalidCurrentPasswordError();
  await getDb().update(users).set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() }).where(eq(users.id, userId));
}

async function getUser(userId: string): Promise<User> {
  const [user] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AccountNotFoundError();
  return user;
}

function isEmailConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505" && "constraint" in error && error.constraint === "users_email_unique");
}
