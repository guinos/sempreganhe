import { NextResponse } from "next/server";
import { z } from "zod";
import { InvalidCustomerPasswordResetTokenError, resetCustomerPassword } from "@/lib/customer-password-reset";

const requestSchema = z.object({ token: z.string().min(40).max(100), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    await resetCustomerPassword(input.token, input.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvalidCustomerPasswordResetTokenError) return NextResponse.json({ error: "Este link é inválido ou expirou." }, { status: 400 });
    return NextResponse.json({ error: "Confira os dados informados." }, { status: 400 });
  }
}
