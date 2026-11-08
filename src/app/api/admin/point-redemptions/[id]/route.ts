import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { pointRedemptionActionSchema, updatePointRedemption } from "@/lib/point-redemptions";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { partnerId, userId } = await requireAdminSession();
    const input = pointRedemptionActionSchema.parse(await request.json());
    const redemption = await updatePointRedemption(partnerId, (await context.params).id, input.action, userId);
    await recordAdminAudit({ partnerId, actorUserId: userId, action: `point_redemption.${input.action === "confirm" ? "confirmed" : "rejected"}`, resourceType: "point_redemption", resourceId: redemption.id });
    return NextResponse.json({ redemption });
  } catch (error) {
    if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (error instanceof Error && error.message.includes("not awaiting")) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
