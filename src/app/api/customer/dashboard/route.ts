import { NextResponse } from "next/server";
import { CustomerSessionError, requireCustomerSession } from "@/lib/customer-auth";
import { getCustomerDashboard } from "@/lib/customer-dashboard";

export async function GET() {
  try {
    const { customerAccountId } = await requireCustomerSession();
    return NextResponse.json(await getCustomerDashboard(customerAccountId));
  } catch (error) {
    if (error instanceof CustomerSessionError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Não foi possível carregar seu painel." }, { status: 500 });
  }
}
