import { NextResponse } from "next/server";
import { partnerRegistrationSchema, PartnerRegistrationConflictError, registerPartner } from "@/lib/onboarding";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const input = partnerRegistrationSchema.parse(await request.json());
    await registerPartner(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof PartnerRegistrationConflictError) return NextResponse.json({ error: "Não foi possível concluir o cadastro. Verifique os dados informados." }, { status: 409 });
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    logger.error({
      errorName: error instanceof Error ? error.name : "UnknownError",
      code: getErrorProperty(error, "code"),
      constraint: getErrorProperty(error, "constraint"),
    }, "Partner onboarding failed");
    return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }
}

function getErrorProperty(error: unknown, property: string): string | undefined {
  if (!error || typeof error !== "object" || !(property in error)) return undefined;
  const value = (error as Record<string, unknown>)[property];
  return typeof value === "string" ? value : undefined;
}
