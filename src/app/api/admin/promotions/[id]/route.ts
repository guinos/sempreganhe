import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deletePromotion, PromotionConflictError, PromotionNotFoundError, promotionUpdateSchema, updatePromotion } from "@/lib/promotions";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { partnerId } = await requireAdminSession();
    const { id } = await context.params;
    const input = promotionUpdateSchema.parse(await request.json());
    return NextResponse.json({ promotion: await updatePromotion(partnerId, id, input) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { partnerId } = await requireAdminSession();
    const { id } = await context.params;
    await deletePromotion(partnerId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof PromotionConflictError) return NextResponse.json({ error: "Promotion public code already exists" }, { status: 409 });
  if (error instanceof PromotionNotFoundError) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
