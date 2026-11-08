import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createPromotion, listPromotions, PromotionConflictError, promotionCreateSchema } from "@/lib/promotions";

export async function GET() {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ promotions: await listPromotions(partnerId) }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { partnerId } = await requireAdminSession();
    const input = promotionCreateSchema.parse(await request.json());
    return NextResponse.json({ promotion: await createPromotion(partnerId, input) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof PromotionConflictError) return NextResponse.json({ error: "Já existe uma promoção com esse código público." }, { status: 409 });
  if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
