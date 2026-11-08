import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createPointReward, listPointRewards, pointRewardCreateSchema } from "@/lib/point-rewards";

export async function GET() {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ rewards: await listPointRewards(partnerId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ reward: await createPointReward(partnerId, pointRewardCreateSchema.parse(await request.json())) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
