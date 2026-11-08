import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deletePointReward, PointRewardNotFoundError, pointRewardUpdateSchema, updatePointReward } from "@/lib/point-rewards";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { partnerId } = await requireAdminSession();
    const { id } = await context.params;
    return NextResponse.json({ reward: await updatePointReward(partnerId, id, pointRewardUpdateSchema.parse(await request.json())) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { partnerId } = await requireAdminSession();
    await deletePointReward(partnerId, (await context.params).id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof PointRewardNotFoundError) return NextResponse.json({ error: "Point reward not found" }, { status: 404 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
