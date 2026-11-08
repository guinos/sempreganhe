import { NextResponse } from "next/server";
import { z } from "zod";
import { requestCustomerPasswordReset } from "@/lib/customer-password-reset";
import { logger } from "@/lib/logger";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) });

export async function POST(request: Request) {
  try {
    const { email } = requestSchema.parse(await request.json());
    await requestCustomerPasswordReset(email);
  } catch (error) {
    // Deliberately return the same response for known and unknown addresses.
    logger.warn({ error: error instanceof Error ? error.name : "unknown" }, "Customer password reset request failed");
  }
  return NextResponse.json({ message: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha." });
}
