import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { listParticipations } from "@/lib/participations";

export async function GET() {
  try {
    const { restaurantId } = await requireAdminSession();
    return NextResponse.json({ participations: await listParticipations(restaurantId) });
  } catch (error) {
    if (error instanceof Error && error.name === "AdminSessionError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
