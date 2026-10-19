import { NextResponse } from "next/server";
import { customerRegistrationSchema, findPublicParticipation, ParticipationNotFoundError, redeemParticipation } from "@/lib/public-promotions";

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
    return NextResponse.json({ participation: result.participation, customer: { name: result.customer.name, phone: result.customer.phone } });
  } catch (error) {
    if (error instanceof ParticipationNotFoundError) return NextResponse.json({ error: "Participation not found" }, { status: 404 });
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
