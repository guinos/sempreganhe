import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { deletePromotion, PromotionConflictError, PromotionLimitError, PromotionNotFoundError, promotionUpdateSchema, updatePromotion } from "@/lib/promotions";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { partnerId, userId } = await requireAdminSession();
    const { id } = await context.params;
    const input = promotionUpdateSchema.parse(await request.json());
    const promotion = await updatePromotion(partnerId, id, input);
    await recordAdminAudit({ partnerId, actorUserId: userId, action: "promotion.updated", resourceType: "promotion", resourceId: id, metadata: { status: input.status ?? null } });
    return NextResponse.json({ promotion });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { partnerId, userId } = await requireAdminSession();
    const { id } = await context.params;
    await deletePromotion(partnerId, id);
    await recordAdminAudit({ partnerId, actorUserId: userId, action: "promotion.deleted", resourceType: "promotion", resourceId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof PromotionConflictError) return NextResponse.json({ error: "Promotion public code already exists" }, { status: 409 });
  if (error instanceof PromotionLimitError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof PromotionNotFoundError) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
