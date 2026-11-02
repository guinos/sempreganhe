import { NextResponse } from "next/server";
import { customerRegistrationSchema, findPublicPartnerWhatsapp, findPublicParticipation, ParticipationLimitReachedError, ParticipationNotFoundError, ParticipationRejectedError, redeemParticipation } from "@/lib/public-promotions";
import { InvalidPhoneError } from "@/lib/phone";

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    return NextResponse.json({ participation: await findPublicParticipation((await context.params).token) });
  } catch (error) {
    if (error instanceof ParticipationNotFoundError) return NextResponse.json({ error: "Participation not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const input = customerRegistrationSchema.parse(await request.json());
    const result = await redeemParticipation((await context.params).token, input);
    const whatsapp = await findPublicPartnerWhatsapp(result.participation.partnerId);
    return NextResponse.json({
      participation: {
        status: result.participation.status,
        whatsappCountryCode: whatsapp?.countryCode ?? null,
        whatsappPhone: whatsapp?.phone ?? null,
      },
      customer: { name: result.customer.name },
    });
  } catch (error) {
    if (error instanceof ParticipationNotFoundError) return NextResponse.json({ error: "Participation not found" }, { status: 404 });
    if (error instanceof ParticipationLimitReachedError) return NextResponse.json({ error: "Este cliente já atingiu o limite desta promoção." }, { status: 409 });
    if (error instanceof ParticipationRejectedError) return NextResponse.json({ error: "Este resgate foi recusado pelo parceiro." }, { status: 409 });
    if (error instanceof InvalidPhoneError) return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 });
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
