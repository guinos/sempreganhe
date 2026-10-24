import { NextResponse } from "next/server";
import { partnerRegistrationSchema, PartnerRegistrationConflictError, registerPartner } from "@/lib/onboarding";

export async function POST(request: Request) {
  try {
    const input = partnerRegistrationSchema.parse(await request.json());
    await registerPartner(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof PartnerRegistrationConflictError) return NextResponse.json({ error: "Não foi possível concluir o cadastro. Verifique os dados informados." }, { status: 409 });
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }
}
