import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { participationActionSchema, ParticipationActionError, updateParticipationStatus } from "@/lib/participations";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { partnerId, userId } = await requireAdminSession();
    const input = participationActionSchema.parse(await request.json());
    const participation = await updateParticipationStatus(partnerId, (await context.params).id, input.action);
    await recordAdminAudit({ partnerId, actorUserId: userId, action: `participation.${input.action === "confirm" ? "confirmed" : "rejected"}`, resourceType: "participation", resourceId: participation.id });
    return NextResponse.json({ participation });
  } catch (error) {
    if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof ParticipationActionError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.message === "Participation not found" ? 404 : 409 });
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
