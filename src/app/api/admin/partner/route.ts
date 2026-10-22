import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getPartner, PartnerConflictError, PartnerNotFoundError, partnerUpdateSchema, updatePartner } from "@/lib/partner";

export async function GET() {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ partner: await getPartner(partnerId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { partnerId } = await requireAdminSession();
    const input = partnerUpdateSchema.parse(await request.json());
    return NextResponse.json({ partner: await updatePartner(partnerId, input) });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof PartnerConflictError) return NextResponse.json({ error: "Slug already used" }, { status: 409 });
  if (error instanceof PartnerNotFoundError) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
