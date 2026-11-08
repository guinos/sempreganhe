import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { listPointRedemptions } from "@/lib/point-redemptions";

export async function GET() {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ redemptions: await listPointRedemptions(partnerId) });
  } catch (error) {
    if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
