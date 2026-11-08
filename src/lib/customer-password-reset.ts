import "server-only";

import { and, eq, isNull, gt } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { getDb } from "@/db";
import { customerAccounts, customerPasswordResetTokens } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export class InvalidCustomerPasswordResetTokenError extends Error {
  constructor() {
    super("Invalid or expired customer password reset token");
    this.name = "InvalidCustomerPasswordResetTokenError";
  }
}

export async function requestCustomerPasswordReset(email: string) {
  const [account] = await getDb().select({ id: customerAccounts.id, email: customerAccounts.email })
    .from(customerAccounts)
    .where(and(eq(customerAccounts.email, email.toLowerCase()), eq(customerAccounts.active, true)))
    .limit(1);
  if (!account) return;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await getDb().transaction(async (tx) => {
    await tx.update(customerPasswordResetTokens).set({ usedAt: new Date() })
      .where(and(eq(customerPasswordResetTokens.customerAccountId, account.id), isNull(customerPasswordResetTokens.usedAt)));
    await tx.insert(customerPasswordResetTokens).values({ customerAccountId: account.id, tokenHash, expiresAt });
  });

  await sendPasswordResetEmail(account.email, token);
}

export async function resetCustomerPassword(token: string, password: string) {
  const tokenHash = hashResetToken(token);
  const now = new Date();
  const passwordHash = await hashPassword(password);
  await getDb().transaction(async (tx) => {
    const [resetToken] = await tx.update(customerPasswordResetTokens).set({ usedAt: now })
      .where(and(eq(customerPasswordResetTokens.tokenHash, tokenHash), isNull(customerPasswordResetTokens.usedAt), gt(customerPasswordResetTokens.expiresAt, now)))
      .returning({ customerAccountId: customerPasswordResetTokens.customerAccountId });
    if (!resetToken) throw new InvalidCustomerPasswordResetTokenError();
    await tx.update(customerAccounts).set({ passwordHash, passwordChangedAt: now, updatedAt: now }).where(eq(customerAccounts.id, resetToken.customerAccountId));
  });
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendPasswordResetEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) throw new Error("Password reset email is not configured");
  const resetUrl = `${appUrl.replace(/\/$/, "")}/customer#resetToken=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: "Redefina sua senha do SempreGanhe", text: `Use este link para redefinir sua senha (válido por 30 minutos): ${resetUrl}` }),
  });
  if (!response.ok) throw new Error("Password reset email delivery failed");
}
