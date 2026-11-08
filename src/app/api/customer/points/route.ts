import { NextResponse } from "next/server";
import { CustomerSessionError, requireCustomerSession } from "@/lib/customer-auth";
import { getCustomerPointsDashboard, pointRedemptionRequestSchema, requestCustomerPointRedemption, CustomerPointError } from "@/lib/customer-points";

export async function GET() {
  try {
    const { customerAccountId } = await requireCustomerSession();
    return NextResponse.json(await getCustomerPointsDashboard(customerAccountId));
  } catch (error) {
    if (error instanceof CustomerSessionError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Não foi possível carregar seus pontos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { customerAccountId } = await requireCustomerSession();
    const { rewardId } = pointRedemptionRequestSchema.parse(await request.json());
    return NextResponse.json({ redemption: await requestCustomerPointRedemption(customerAccountId, rewardId) }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerSessionError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof CustomerPointError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    return NextResponse.json({ error: "Não foi possível solicitar o resgate." }, { status: 500 });
  }
}
